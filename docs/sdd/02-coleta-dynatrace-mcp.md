# Coleta de componentes e enriquecimento

## 1. O que foi confirmado na pesquisa

O modelo Smartscape fornece nós e relações tipadas, consultáveis com `smartscapeNodes`, `smartscapeEdges` e `traverse`. Os tipos e relações disponíveis devem ser descobertos no ambiente, sem assumir uma cadeia obrigatória aplicação → serviço → processo → host. [Smartscape core model](https://docs.dynatrace.com/docs/semantic-dictionary/model/smartscape/core).

Smartscape on Grail é mutável, tem retenção documentada de 35 dias e amplia janelas inferiores a 15 minutos. A documentação informa inclusão das consultas Smartscape no DPS; isso não torna gratuitas as consultas adicionais de telemetria nem ferramentas MCP. O produto preservará seu próprio histórico de snapshots. [Smartscape on Grail](https://docs.dynatrace.com/docs/platform/grail/smartscape-on-grail).

A relação `calls` de frontend para serviço foi anunciada no SaaS 1.343. Sua existência no tenant é uma capacidade a testar. [Release SaaS 1.343](https://docs.dynatrace.com/docs/whats-new/saas/sprint-343).

## 2. Resolução de URL

Entrada de exemplo: `https://portoseguro.com.br/aplicacao-a`.

1. Validar `http`/`https`, tamanho e sintaxe. Rejeitar credenciais embutidas. Não fazer conexão à URL informada.
2. Normalizar scheme/host e porta padrão. Preservar semântica do path: maiúsculas, escapes reservados e barra final não são colapsados sem regra do domínio.
3. Persistir somente parâmetros de query permitidos e necessários à identidade. Dados removidos não entram em logs. Um fragmento de rota SPA pode ser mantido de forma sanitizada como pista do produto; não é prova da detecção no servidor.
4. Aplicar regra de path explícita: `EXACT`, `SEGMENT_PREFIX` ou `ROUTE_TEMPLATE`. `/aplicacao-a` não casa com `/aplicacao-ab`. Templates e aliases são versionados e confirmados, nunca inferidos silenciosamente por remoção de números.
5. Consultar vínculo persistido sob a fronteira de autorização. Verificar validade e se ainda aponta para uma raiz existente.
6. Procurar candidatos em configuração permitida de frontend, catálogo e evidência RUM limitada. Múltiplos candidatos exigem seleção; zero candidatos gera orientação para associação manual ou instrumentação.

Um domínio pode conter aplicações diferentes, e uma aplicação pode ter vários domínios. Modelar `Application` e `UrlBinding` separadamente. Não usar o domínio registrável como chave única da aplicação. A URL do tenant Dynatrace é configuração administrativa e não pode ser substituída pela entrada de busca.

Regras de detecção podem usar URL ou host e não recebem o fragmento no servidor. Proxies e reescritas também influenciam a associação. [Configuração de frontend](https://docs.dynatrace.com/docs/observe/digital-experience/new-rum-experience/web-frontends/initial-setup/set-up-auto-injected-frontend).

## 3. Evidência de rota versus evidência de frontend

| Origem | O que permite afirmar | O que não permite afirmar |
| --- | --- | --- |
| Vínculo URL → frontend configurado | Associação daquela regra ao frontend | Que todos os serviços do frontend pertencem àquela rota |
| Smartscape `FRONTEND calls SERVICE` | Relação do frontend com o serviço | Uso específico por `/aplicacao-a` |
| Evento RUM de request com domínio/path | Endpoint do request observado | Que o path do request é a página de origem |
| Contexto de navegação + correlação de trace | Associação à rota, se capturada e validada | Cobertura completa do tráfego ou de todos os usuários |
| Confirmação de usuário | Associação declarada com autoria | Evidência técnica de chamada observada |
| Texto gerado por IA | Hipótese de investigação | Aresta factual confirmada |

RUM oferece `dt.smartscape.frontend` e campos de URL; alguns campos de correlação, como `trace.id` e `span.id`, têm estabilidade experimental. Mascaramento, sampling e configuração podem impedir a associação. O contrato de evidência registra essas limitações. [User events](https://docs.dynatrace.com/docs/semantic-dictionary/model/rum/user-events), [Requests](https://docs.dynatrace.com/docs/semantic-dictionary/model/rum/user-events/requests), [Frontend/backend linking](https://docs.dynatrace.com/docs/observe/digital-experience/rum/analyze-and-alert/analyze-frontend-to-backend).

## 4. Etapas de obtenção

| Etapa | Entrada | Fonte / estratégia | Saída e condição de parada |
| --- | --- | --- | --- |
| RESTORE_BASELINE | Contexto autorizado e URL normalizada | PostgreSQL | Snapshot e cobertura conhecidos; nenhuma chamada remota |
| Plano inicial, antes da primeira chamada | Contexto, capabilities e política | Serviço local | Reserva limitada para resolver a raiz; mesmo prazo/orçamento do run |
| RESOLVE_TARGET | Vínculo/candidatos | Cache, configuração, Smartscape, RUM limitado | Raiz confirmada, seleção ou evidência insuficiente |
| PLAN_REFRESH | Raiz, cobertura, validade e política | Serviço local | Plano finito e reservas; etapas válidas são reutilizadas |
| FETCH_TOPOLOGY | IDs de raízes e fronteira | Smartscape/Grail; clássico se homologado | Nós/arestas observados dentro dos limites |
| VALIDATE_ROUTE | Lacunas específicas de atribuição | RUM e spans com templates | Evidência de rota ou limitação explícita; opcional |
| FETCH_HEALTH | IDs conhecidos, janela e baseline/SLO | Métricas RED agregadas e problemas Dynatrace no escopo | Saúde e achados de desempenho/resiliência; sem varredura de logs por padrão |
| ENRICH_GAPS | Lista limitada de lacunas e delta | MCP com ferramentas permitidas | Evidência adicional ou sugestões estruturadas; opcional |
| PUBLISH_SNAPSHOT | Lotes consistentes e cobertura | PostgreSQL | Snapshot final, diff e evento terminal |

Saídas úteis são persistidas ao final de cada lote/etapa; `PUBLISH_SNAPSHOT` encerra o resultado. A ordem permite apresentar a topologia antes de completar saúde e enriquecimento. `PLAN_REFRESH` detalha o plano inicial depois da resolução; não cria novo orçamento nem deadline. O snapshot histórico registra o conhecimento observado/persistido pelo produto naquela coleta, sem prometer uma visão point-in-time retroativa do Dynatrace.

### Expansão da topologia

Usar BFS com conjunto de visitados por identidade do fornecedor. Profundidade de chamadas e expansão de infraestrutura são contadores distintos: profundidade padrão de `calls` = 2; relações de hospedagem/pertencimento usam expansão separada de até 2 passos e teto global de elementos. Uma relação de infraestrutura não reinicia o contador de chamadas.

Consultar IDs em lotes, evitar uma chamada por nó e manter ordem determinística. Não seguir `calls` a partir de qualquer entidade externa sem orçamento específico. Nós compartilhados aparecem uma vez, com múltiplas relações. Ciclos são preservados no grafo e não reexecutam a fronteira visitada.

O truncamento registra fronteira restante, razão e cobertura. Não prometer cursor remoto retomável se o fornecedor não o garantir; continuação pode consultar novamente uma fronteira conhecida com deduplicação e orçamento novo.

### Adapter clássico

Somente para ambiente cuja capability exigir compatibilidade: `GET /api/v2/entities` e `GET /api/v2/entities/{entityId}`, com seletor, campos e paginação limitados. Ler tipos/relações suportados em vez de adivinhar payloads. `nextPageKey` é checkpoint por identidade e consulta. Não misturar IDs clássicos e Smartscape pela semelhança de nome; usar crosswalk explícito quando existir. [Entities API](https://docs.dynatrace.com/docs/dynatrace-api/environment-api/entity-v2).

## 5. Query API e proteção de consultas

O adapter Java usa HTTP para a API de plataforma. A referência TypeScript abaixo documenta o contrato HTTP; ela não significa instalar SDK Node no SERVICE Java.

Endpoint de execução:

```text
POST https://{environment}.apps.dynatrace.com/platform/storage/query/v1/query:execute
```

Execução assíncrona usa `requestToken`, seguido de poll/cancel sob a mesma identidade. Persistir imediatamente tokens e resultados recuperáveis. A disponibilidade garantida do resultado concluído é de um minuto; fazer polling em intervalos inferiores a 60 s e nunca suspendê-lo durante espera humana. [Grail service](https://developer.dynatrace.com/develop/platform-services/services/grail-service/).

`requestTimeoutMilliseconds` não é o deadline da execução; `fetchTimeoutSeconds` e o limite de bytes são limites suaves. O default de scan no request pode ser sobrescrito no DQL. O serviço precisa de seu próprio watchdog e validação de todas as fontes/subconsultas. [Query API reference](https://developer.dynatrace.com/develop/sdks/client-query/v1/).

Regras do produto:

- No MVP, DQL vem de templates versionados com parâmetros tipados e escapes corretos. Não concatenar URL ou texto MCP como comando.
- Toda consulta tem janela absoluta, fontes permitidas, limites de retorno e orçamento. Cada `fetch` conta no teto agregado, inclusive subconsultas. Proibir `scanLimitGBytes: -1`.
- Não aceitar DQL gerado arbitrariamente no MVP. Em expansão, somente após parser/AST confiável, inspeção de todas as fontes e reescrita segura; caso contrário, manter o catálogo de templates.
- `limit` restringe retorno, não é garantia de baixo scan. Usar janela curta, buckets autorizados e filtros cedo; sampling pode reduzir custo, mas reduz evidência.
- Registrar metadados de scan, query ID, sampling e notificações; HTTP 200 com warning pode ser parcial.
- Quando suportado, `pollingPromiseSeconds` protege contra cliente perdido. Não substitui a recuperação do worker.

As regras de `scanLimitGBytes` e sampling constam em [Data source commands](https://docs.dynatrace.com/docs/platform/grail/dynatrace-query-language/commands/data-source-commands); práticas de eficiência estão em [DQL best practices](https://docs.dynatrace.com/docs/platform/grail/dynatrace-query-language/dql-best-practices). A proteção por promessa de polling deve ser homologada segundo o [changelog da Query API](https://developer.dynatrace.com/changelogs/sdks/client-query/).

## 6. MCP e Assist

O nome de integração será **enriquecimento por ferramentas MCP do Dynatrace**. Assist é uma experiência que utiliza ferramentas; não se presume acesso externo às conversas ou ao contexto visual do Assist. Uma futura API conversacional exige contrato próprio. [Dynatrace Assist](https://docs.dynatrace.com/docs/dynatrace-intelligence/agentic-and-generative-ai/chat-with-dynatrace-assist).

Usar o MCP remoto oficial, cujo endpoint documentado é:

```text
https://{environment}.apps.dynatrace.com/platform-reserved/mcp-gateway/v0.1/servers/dynatrace-mcp/mcp
```

Ele requer Bearer por requisição e permissões de gateway e de ferramenta. A autenticação MCP será homologada separadamente da API: não assumir que qualquer grant permitido na API funciona no gateway. Catálogo e schemas vêm da identidade autorizada. [Dynatrace MCP](https://docs.dynatrace.com/docs/dynatrace-intelligence/dynatrace-mcp). O servidor local anterior está arquivado e não é a baseline. [Repositório legado](https://github.com/dynatrace-oss/dynatrace-mcp).

### Compatibilidade do protocolo

Não desenhar uma conexão permanente obrigatória. A revisão 2026-07-28 de Streamable HTTP removeu sessões de protocolo e o GET independente; requisições usam POST e respostas podem ter stream próprio. O perfil anterior usa inicialização e pode fornecer `Mcp-Session-Id`. A integração deve homologar o perfil real do tenant e do SDK, com cancelamento correspondente. [Streamable HTTP 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http), [Lifecycle 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle), [Transporte 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports).

`McpClientRegistry` mantém recursos limitados por `(environment, credentialPrincipal, permissionVersion, protocolProfile)`. Reutiliza cliente/pool HTTP, não uma instância por usuário da tela ou componente do mapa. Clientes ociosos expiram; operações ativas não são removidas por evicção. Credenciais distintas jamais são trocadas em um singleton compartilhado.

Construção programática sobre o SDK Java oficial é a proposta inicial. Spring AI é alternativa sem habilitar um modelo de chat ou despacho automático de ferramentas. Sua autoconfiguração de singletons não fornece isolamento por tenant/usuário automaticamente. [SDK Java](https://java.sdk.modelcontextprotocol.io/latest/), [Spring AI MCP client](https://docs.spring.io/spring-ai/reference/api/mcp/mcp-client-boot-starter-docs.html).

### Ferramentas e oportunidades

Allowlist inicial por finalidade, não por nome presumido: resolver entidade, executar consulta determinística limitada e, após homologação financeira, gerar sugestão estruturada. Registrar nome efetivo, schema hash, estabilidade, permissões, classe de custo e controles possíveis. Mudança de schema desabilita a ferramenta até validação. Annotations de leitura não substituem análise do comportamento.

Não habilitar `operator`, investigação livre ou ferramenta que delega subchamadas ilimitadas. Tool sem teto verificável de consumo/consulta fica fora do caminho automático. Geração de DQL pode sugerir um template permitido; a execução ocorre pela Query API governada, sem confiar em query textual retornada.

Cada oportunidade contém `type`, `subjectIds`, `claim`, `evidenceIds`, `scope`, `limitations`, `suggestedNextAction` e `status`. Classificações de confiança são explicáveis (`DIRECT`, `CORRELATED`, `CONFIGURED`, `HYPOTHESIS`), sem porcentagens não calibradas.

Regras principais de latência, falhas, dependências degradadas e problemas Dynatrace estão no [perfil de desempenho/resiliência](07-desempenho-resiliencia.md). Sinais complementares:

| Sinal | Resultado aceitável |
| --- | --- |
| Nova relação observada contra baseline comparável | “Nova dependência observada”, com IDs e janelas |
| Chamada para endpoint sem destino monitorado identificável | “Possível lacuna de observabilidade”, incluindo alternativas como externo ou permissão insuficiente |
| Relação só disponível no frontend inteiro | “Atribuição à rota ainda não comprovada” |
| MCP indisponível | Preservar regra determinística e registrar enriquecimento indisponível |

Prompt injection em nomes, logs ou conteúdo retornado é tratado como dado não confiável. Texto externo não muda ferramentas, destinos, orçamento, autorização ou etapas. Não enviar logs brutos e dados pessoais para enriquecimento por padrão.

## 7. Credenciais e capacidades

Configuração registra referências a segredos, principal lógico, fronteira de visibilidade e versão de permissões. Selecionar Client Credentials para API máquina a máquina ou delegação por usuário conforme o modelo autorizado; renovar token de forma coordenada, sem obter um token por chamada. [OAuth clients](https://docs.dynatrace.com/docs/manage/identity-access-management/access-tokens-and-oauth-clients/oauth-clients).

Escopos candidatos: `storage:smartscape:read`; adicionalmente `storage:user.events:read`, `storage:spans:read` e `storage:metrics:read` apenas nas etapas habilitadas. MCP adiciona `mcp-gateway:servers:read` e `mcp-gateway:servers:invoke` mais os escopos das ferramentas. Compatibilidade clássica usa credencial/escope próprio, como `entities.read`. Confirmar políticas efetivas, não apenas claims do token. [IAM policy statements](https://docs.dynatrace.com/docs/manage/identity-access-management/permission-management/manage-user-permissions-policies/advanced/iam-policystatements).

O probe de capacidades é pequeno, cacheado e acionado no onboarding ou expiração controlada. Não varre dados nem redescobre catálogo em cada busca. Registra `supported`, `unsupported`, `forbidden` ou `unknown`; um 403 não significa ausência de capability.
