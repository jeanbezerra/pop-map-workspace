# Modelo de dados, consistência e contratos

## 1. Modelo lógico PostgreSQL 18

Este é um modelo para orientar migrations futuras, não DDL já validado. Escolher driver, pool, Flyway/Liquibase e minor PostgreSQL no spike. Usar schema `popmap`, `uuid`, `timestamptz`, tipos numéricos exatos para custo, constraints e nomes `lower_snake_case`.

IDs podem usar `uuidv7()` do PostgreSQL 18. O UUID não é autorização e pode revelar ordenação temporal. Instantes são UTC, apresentados no fuso da pessoa. [PostgreSQL 18 — UUID functions](https://www.postgresql.org/docs/18/functions-uuid.html).

| Tabela | Campos/conceitos principais | Invariantes |
| --- | --- | --- |
| `organization` | ID, nome e política vigente | Fronteira organizacional |
| `dynatrace_environment` | Organização, base URLs aprovadas, label, capability version | Endpoint é configuração administrativa |
| `credential_context` | Ambiente, principal lógico, referência de segredo, versão de permissão | Sem token em coluna de negócio ou log |
| `visibility_scope` | Organização, ambiente, fingerprint de autorização, versão | Nunca misturar dados entre scopes |
| `application` | Scope, ID interno, nome, status | Uma aplicação tem vários vínculos e raízes |
| `url_binding` | Aplicação, host/path normalizados, modo de match, versão, confirmação | Sem colisão silenciosa; candidatos múltiplos são possíveis |
| `application_root` | Aplicação, namespace/ID/tipo Dynatrace, validade | Nome não é identidade |
| `search_session` | Usuário, scope, pedido, estado, baseline/final snapshot, razão, deadlines | Uma intenção por busca; final imutável |
| `session_run` | Sessão, run, inscrição/desassociação, snapshot no cancelamento | Vários assinantes só em run elegível |
| `discovery_run` | Scope, work key, shareable, plano/política, estado, prazos, lease/fence | No máximo um run ativo para chave compartilhável |
| `discovery_step` | Run, etapa, estado, limites, checkpoint, início/fim | Checkpoint idempotente por etapa/lote |
| `provider_operation` | Intent ID, run/etapa, fonte/tool/template, identidade, request token protegido, outcome | Distingue `NOT_SENT`, `ACCEPTED`, `SUCCEEDED`, `FAILED`, `CANCELLED`, `UNKNOWN` |
| `topology_entity` | Scope, namespace, external ID, tipo, atributos normalizados | Unique `(scope, namespace, external_id)` |
| `topology_relation` | Scope, origem, destino, tipo/direção | Relações tipadas; evidências independentes |
| `evidence` | Operação, assunto, fonte, método, janela, observação/coleta, classificação, limitações, payload sanitizado | Nenhum fato sem proveniência; raw payload não obrigatório |
| `graph_snapshot` | Scope, aplicação, versão, created, intervalos, cobertura, baseline/digest | Imutável depois de publicado |
| `snapshot_node` / `snapshot_edge` | Snapshot, entidades/relações e versão dos atributos exibidos | Histórico não lê atributo mutável “atual” para reconstruir tela antiga |
| `snapshot_evidence` | Snapshot e evidências incluídas | Só evidências do mesmo scope |
| `health_observation` | Snapshot, entidade, indicador, unidade, janela, valor e qualidade | Zero, desconhecido e indisponível são distintos |
| `opportunity` | Tipo, assunto, status, evidências, regra/modelo/prompt versionados, limitações | Hipótese não altera relação observada |
| `budget_account` / `budget_reservation` / `usage_entry` | Limites por dimensão, reservas, observado, risco desconhecido, período e versão de preço | Atualização atômica; sem saldo negativo por concorrência |
| `session_event` / `outbox_event` | Sequência por sessão, evento, versão snapshot, payload sanitizado | Estado/snapshot e evento no mesmo commit |
| `saved_view` | Sessão/usuário, filtros, posições fixadas, seleção | Não muda cobertura ou dados compartilhados |
| `audit_event` | Ator, ação, scope, alvo, instante, motivo | Sem segredos; trilha de autorização e decisões |

Campos de controle e filtros frequentes são relacionais. `jsonb` guarda atributos específicos de fonte, plano, cobertura e payload limitado; não substitui chaves, estados, valores de orçamento ou relacionamentos. Índices JSON são adicionados somente se as consultas exigirem. [PostgreSQL 18 — JSON types](https://www.postgresql.org/docs/18/datatype-json.html).

### Isolamento e constraints

Todas as entidades de dados carregam `organization_id` e `visibility_scope_id` quando aplicável. FKs compostas ou constraints equivalentes impedem cruzar scope entre run, snapshot, nó, relação e evidência. Alterar versão de autorização invalida a elegibilidade de cache; remoção de acesso é verificada também ao reabrir histórico.

`work_key` é hash canônico do pedido elegível, com payload original persistido para verificar equivalência. Índice único parcial para `shareable = true` nos estados não terminais protege single-flight. Runs privados não disputam essa chave. Claim e mudança de estado usam compare-and-set por `row_version`/fencing.

Índices iniciais candidatos: sessões por `(scope, user, created_at desc, id)`; snapshots por `(scope, application, created_at desc, id)`; fila por `(state, available_at, priority, id)` nos estados ativos; arestas por origem e por destino; evidências por assunto/janela; eventos por `(session_id, sequence)`. Validar planos e concorrência antes de produção, sem fixar índices redundantes por hábito.

## 2. Transações e recuperação

- Criar sessão/idempotência, associar run, reservar orçamento e gravar evento em transação curta.
- Chamadas API/MCP nunca ocorrem com transação/lock de banco aberto.
- Persistir lote: validar fence e estado → upsert identidades/evidências → materializar snapshot consistente → gravar evento/outbox → commit.
- Despacho de outbox pode repetir. Consumidor deduplica por ID/sequence e não chama Dynatrace como reação a evento de apresentação.
- Cancelar uma sessão: em um commit, desassociar, fixar snapshot final N e gravar estado/evento. Publicação posterior N+1 do run compartilhado só atende outros assinantes.
- Retry de deadlock/serialization refaz somente a transação local limitada, nunca inclui repetição implícita do I/O remoto.

Lease não impede sozinho worker antigo de escrever; exigir fence. Operação `UNKNOWN` conserva risco financeiro e ocupação remota potencial até reconciliação ou prazo remoto comprovado. Se o slot fica indeterminado, o conector pode ser colocado em quarentena, sem deixar o run do usuário eternamente ativo.

## 3. Retenção e operação

Proposta inicial: sessões/snapshots 90 dias; eventos de progresso 7 dias; payloads sanitizados de evidência 7 dias; auditoria/ledger 180 dias, ajustados à política corporativa. Manter metadados/evidências resumidas usados por snapshots durante sua retenção; payload bruto pode expirar e isso aparece no detalhe. Pendências de consumo não são descartadas antes de reconciliação.

Purge em lotes respeita FKs, referências de comparação e retenção legal. Não criar particionamento no primeiro incremento sem volumetria. Separar roles migrator/runtime/read-only; runtime sem superuser ou owner. RLS pode ser defesa adicional, testada inclusive com pool e `SET LOCAL` por transação; filtrar organização sem scope efetivo não basta. [PostgreSQL 18 — Row security](https://www.postgresql.org/docs/18/ddl-rowsecurity.html).

Dimensionar pool API + workers dentro do limite do banco. Medir waits, transações longas, autovacuum, WAL, armazenamento e contenção da fila. Definir RPO/RTO, backup e restore ensaiado antes de produção. Nenhuma extensão de grafo é requisito.

## 4. API do produto

Prefixo `/api/v1`. Todos os endpoints exigem autenticação e autorização atual. Organização, usuário e scope derivam do contexto de segurança; não confiar em IDs fornecidos pelo browser como prova de acesso.

| Método / recurso | Semântica |
| --- | --- |
| `GET /environments` | Ambientes permitidos e capacidades resumidas, sem segredos |
| `POST /search-sessions` | Criar intenção; retornar sessão e baseline; pode associar run existente |
| `GET /search-sessions/{id}` | Estado, etapas, prazos, orçamento, referências e razões |
| `GET /search-sessions?cursor=…` | Histórico autorizado, com paginação por chave |
| `POST /search-sessions/{id}/selection` | Confirmar candidato autorizado antes do prazo; run privado |
| `POST /search-sessions/{id}/cancel` | Desassociar/cancelar de modo idempotente; preservar versão final |
| `POST /search-sessions/{id}/continuations` | Nova sessão vinculada, com novo escopo limitado |
| `GET /search-sessions/{id}/events` | SSE com replay autorizado por sequência |
| `GET /snapshots/{id}/graph` | Nós/arestas persistidos, filtros e paginação; não inicia coleta |
| `GET /snapshots/{id}/coverage` | Escopo, janelas, fontes e limitações |
| `GET /snapshots/{id}/opportunities` | Achados explicáveis ligados às evidências |
| `GET /evidence/{id}` | Evidência autorizada e sanitizada |
| `GET /snapshot-comparisons?from=…&to=…` | Diff entre snapshots compatíveis, sem atualização remota |
| `PUT /search-sessions/{id}/view` | Filtros/posições do usuário; sem efeito na coleta |

Não expor endpoint que aceite URL arbitrária de MCP, SQL ou DQL livre. Endpoints administrativos para credenciais/políticas ficam fora do fluxo comum e exigem perfil específico.

### Criar busca

```http
POST /api/v1/search-sessions
Idempotency-Key: 9ae18e83-45a1-49f2-b93b-7492c7907a7c
Content-Type: application/json
```

```json
{
  "environmentId": "env-producao",
  "url": "https://portoseguro.com.br/aplicacao-a",
  "pathMatch": "SEGMENT_PREFIX",
  "objective": "PERFORMANCE_RESILIENCE",
  "timeMode": "CURRENT_AS_OF",
  "window": { "relative": "PT1H" },
  "profile": "STANDARD",
  "refresh": "IF_NEEDED"
}
```

O servidor resolve `relative` em intervalo absoluto uma vez. `pathMatch` default conservador é `EXACT`; o exemplo usa prefixo escolhido conscientemente. `refresh=NOW` exige tentativa de atualização; cache continua baseline, e não conclusão falsa.

Responder `201 Created`, `Location` e corpo da sessão criada; a execução é assíncrona. Retransmissão idempotente usa `200 OK` com a mesma sessão. Mesma chave com corpo diferente retorna `409`. Idempotência é escopada a ator e organização e mantida pelo menos pela vida da sessão.

```json
{
  "id": "019a0000-0000-7000-8000-000000000001",
  "state": "QUEUED",
  "resultKind": null,
  "requestedInterval": {
    "from": "2026-10-28T13:00:00Z",
    "to": "2026-10-28T14:00:00Z"
  },
  "baselineSnapshotId": "019a0000-0000-7000-8000-000000000002",
  "finalSnapshotId": null,
  "runId": "019a0000-0000-7000-8000-000000000003",
  "executionMode": "SHARED_REFRESH",
  "deadlineAt": "2026-10-28T14:12:30Z",
  "policyVersion": "pilot-0.1",
  "eventsUrl": "/api/v1/search-sessions/019a0000-0000-7000-8000-000000000001/events"
}
```

IDs/horários são ilustrativos. `executionMode` admite `CACHE_ONLY`, `PRIVATE_RESOLUTION`, `NEW_REFRESH` e `SHARED_REFRESH`. O deadline da sessão não pode ser ampliado ao associar run existente.

### Cobertura e elemento de grafo

`GraphSnapshot.coverage` contém `requestedInterval`, `effectiveProviderInterval`, `structureObservedAt`, `retrievedAt`, `freshUntilByLayer`, raízes, tipos/relações, profundidades, fontes, flags `truncated`/`sampled`, razões e fronteiras não exploradas.

```json
{
  "id": "edge-21",
  "source": "frontend-1",
  "target": "service-7",
  "relation": "CALLS",
  "evidenceScope": "FRONTEND",
  "evidenceClass": "DIRECT",
  "evidenceIds": ["evidence-45"],
  "routeAttribution": "NOT_PROVEN",
  "observedFrom": "2026-10-28T13:00:00Z",
  "observedTo": "2026-10-28T14:00:00Z"
}
```

Uma aresta pode ser direta no escopo frontend e continuar sem atribuição à rota. Métricas preservam unidade, agregação, denominador, número de amostras quando disponível e janela; `null` significa desconhecido, não zero.

### Motivos e resultados

`state` controla lifecycle; `resultKind`, `completionReason` e `failureClass` explicam o resultado. Exemplos de razões:

`FRESH_CACHE`, `PLAN_COMPLETE`, `NO_MATCH`, `INSUFFICIENT_EVIDENCE`, `QUEUE_TIMEOUT`, `INPUT_TIMEOUT`, `ACTIVE_TIMEOUT`, `ABSOLUTE_TIMEOUT`, `NODE_LIMIT`, `SCAN_LIMIT`, `BUDGET_REJECTED`, `MCP_UNAVAILABLE`, `MCP_SCHEMA_CHANGED`, `FORBIDDEN_SOURCE`, `OUTCOME_UNKNOWN`, `USER_CANCELLED`.

Sem raiz confirmada, `NO_MATCH`/`INSUFFICIENT_EVIDENCE` gera `FAILED` com `failureClass=DOMAIN` e orientação, ou `PARTIAL` quando há baseline útil; não é exibido como pane técnica nem entra na taxa de erro do fornecedor. Se o usuário puder indicar raiz autorizada, o fluxo pode aguardar essa entrada uma única vez. Falha de rede sem evidência suficiente usa `failureClass=PROVIDER` e razão específica.

Erros HTTP usam Problem Details com código estável e correlation ID: `400` sintaxe; `401` autenticação; `403/404` conforme política de ocultação; `409` idempotência/estado incompatível; `422` escopo inválido; `429` admissão local. Uma falha assíncrona do fornecedor é consultada no recurso sessão, não convertida em sucesso HTTP de coleta.

## 5. Eventos e SSE

Envelope mínimo: `eventId`, `sessionId`, `sequence`, `occurredAt`, `eventType`, `state`, `phase`, `snapshotId`, `snapshotVersion`, `reason`, resumo de progresso e consumo. Sequência monotônica por sessão alocada atomicamente; não usar uma sequence global como se fosse sequência contígua de cada sessão.

Eventos: `session.created`, `baseline.available`, `run.attached`, `phase.changed`, `selection.required`, `graph.available`, `opportunity.available`, `budget.updated`, `warning.raised`, `session.finished`.

O stream envia o ID de sequência no campo SSE `id`. Cliente deduplica eventos e aplica versões crescentes. Reconexão com cursor válido faz replay; cursor expirado devolve sinal `resync.required`, e o cliente busca sessão/snapshot atual. Heartbeat é comentário de transporte, não progresso. Estado terminal fecha EventSource no cliente.

Autenticar por cookie seguro same-origin com proteção CSRF nos comandos, ou streaming via fetch autenticado conforme a arquitetura escolhida. Não colocar bearer em query string. Revalidar acesso no handshake/replay e periodicamente durante stream longo; revogação encerra o canal. Controlar número de conexões por usuário e usar HTTP/2 quando disponível. A conexão Web nunca determina o lifecycle do cliente MCP.

## 6. Segurança aplicável à integração

Allowlist de destinos Dynatrace; redirects só para destinos previamente aprovados; sem credenciais enviadas a host derivado da URL de aplicação. IDs em links para Dynatrace devem ser codificados e usar origem aprovada. Payloads de fornecedor passam por validação, limites de tamanho e sanitização antes da Web. Nenhum HTML de ferramenta é renderizado como confiável.

Para credencial máquina a máquina, a aplicação precisa aplicar autorização própria sobre catálogo e grafo. Para delegação por pessoa, cache e cliente MCP preservam identidade e permissões. Nunca servir dados de uma credencial mais ampla a usuário sem autorização equivalente.
