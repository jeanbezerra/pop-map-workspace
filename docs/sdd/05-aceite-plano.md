# Critérios de aceite e plano orientado pela especificação

## 1. Como desenvolver a partir deste SDD

Para cada incremento: selecionar requisitos → revisar contrato e cenários → implementar o menor fluxo vertical → executar verificações proporcionais → demonstrar comportamento e limitações → atualizar a especificação se a decisão mudou. Mudança de contrato, estado, evidência ou orçamento precisa alterar o SDD e seus cenários no mesmo trabalho.

Os arquivos JSON são contratos propostos, não uma máquina já executada pelo backend. [acceptance.feature](acceptance.feature) é uma especificação comportamental; os steps serão implementados conforme cada fatia for entregue.

## 2. Incrementos

| Incremento | Entrega | Gate para avançar |
| --- | --- | --- |
| I0 — homologação | Matriz SaaS/Grail/MCP, schemas, protocolos, credenciais e preços; stack e driver fixados | Consulta limitada e ferramenta MCP de leitura demonstradas; limites, cancelamento e unidade de scan documentados |
| I1 — primeiro mapa | Fluxo Web → Spring → PostgreSQL; sessão, URL/raiz, topologia limitada, snapshot, SSE e cancelamento | Busca nova e repetida; estados persistidos; nenhum job sem prazo; filtro não consulta fornecedor |
| I2 — leitura SRE/ERT | Mapa por serviços, agrupamento, legenda, ajuda contextual, tabela equivalente e detalhes de evidência | Usuários SRE/ERT conseguem identificar tipos e relações sem ler o SDD; ver [critérios de legibilidade](08-mapa-sre-ert-ajuda.md) |
| I3 — desempenho/resiliência | RED, baselines/SLOs existentes, problemas e regras iniciais, sem IA obrigatória | Sem média de p95; zero versus desconhecido; correlação não apresentada como causa; cobertura de rota explícita |
| I4 — enriquecimento MCP | Registry isolado, allowlist, schema validation, timeout/outcome e ledger | Falha MCP não elimina mapa; nenhuma tool opaca no automático; quotas comprovadas em concorrência |
| I5 — operação e escala do piloto | Single-flight, limites distribuídos, recuperação de worker, auditoria e retenção | Carga representativa, crash/replay/cancelamento e isolamento passam; restore ensaiado antes de produção |

As proteções de budget, segurança e prazo começam em I1; I5 exercita escala e recuperação mais amplas. Não são endurecimento adiado. A primeira versão operacional reúne I0–I5; demonstradores anteriores são explicitamente parciais.

## 3. Matriz de aceite

| ID | Cenário verificável | Requisitos |
| --- | --- | --- |
| AC-01 | URL inédita sem baseline gera sessão e mapa ou resultado de domínio explicável, dentro dos limites | RF-01/04/06/08 |
| AC-02 | Cache válido compatível é exibido antes da atualização; `refresh=NOW` não termina falsamente por cache | RF-02/14 |
| AC-03 | Duas buscas simultâneas elegíveis, com raiz confirmada e intervalo igual, criam duas sessões e um run remoto | RF-03/17 |
| AC-04 | Reenvio idempotente mantém sessão; corpo diferente com mesma chave retorna conflito | RF-01 |
| AC-05 | Vinte mudanças de filtros/zoom/layout não aumentam chamadas API/MCP | RF-09 |
| AC-06 | Recarregar a página e perder SSE recupera estado sem nova coleta | RF-07, RNF-07 |
| AC-07 | Fila, execução ativa, entrada e prazo absoluto expiram com razões distintas | RF-08 |
| AC-08 | Scan/nós/bytes/quota atingidos produzem resultado parcial ou falha sem mapa, sem ampliar limites | RF-08/20 |
| AC-09 | Cancelar um assinante preserva versão N e não encerra o run dos demais; N+1 não altera o cancelado | RF-16/17 |
| AC-10 | MCP indisponível ou schema alterado preserva mapa determinístico e explicita cobertura | RF-11/12 |
| AC-11 | Timeout com possível execução paga não provoca retry automático; risco e slot remoto são conciliados | RNF-03/04 |
| AC-12 | Worker antigo após lease perdido não publica; watchdog conclui o run | RNF-03 |
| AC-13 | Outro ambiente/scope não recebe baseline, evidência, evento ou credencial por cache | RF-03, RNF-01 |
| AC-14 | URL parecida, query sensível, hash route e reescrita não geram associação silenciosa | RF-04/05, RNF-05 |
| AC-15 | Frontend inteiro não é apresentado como evidência específica da rota | RF-04/13 |
| AC-16 | Ausência/sampling não remove componentes nem os marca saudáveis automaticamente | RF-18/20/22 |
| AC-17 | Sem baseline/SLO comparável há observação, sem alerta de regressão fabricado | RF-19/21 |
| AC-18 | Falhas são calculadas por contagens; p95 não é média de percentis; zeros preservam semântica | RF-21 |
| AC-19 | Um host/serviço observado não é rotulado como SPOF confirmado | RF-22 |
| AC-20 | Fluxo e ajuda operam por teclado, zoom de 200% e alternativa textual | RNF-06 |
| AC-21 | Candidatos ambíguos de duas sessões têm decisões independentes e prazo sem ocupar worker | RF-05/08/17 |
| AC-22 | Todas as arestas factuais e oportunidades têm evidências, janela e descrição acessíveis | RF-13, RNF-06 |
| AC-23 | Visão por serviços, ajuda por tipo e grupos preservam legibilidade, problemas/sem dados e estabilidade de foco | RF-23/24/25 |

## 4. Verificações na implementação

**Domínio:** transições, guards, prazos com relógio controlado, normalização conservadora, cobertura temporal, regras de métricas e admissão de orçamento. Usar testes que expressem invariantes e falhas reais, sem espelhar getters/implementação.

**PostgreSQL 18 real:** migrations, constraints de scope, single-flight concorrente, disputa de reservas, fencing, cancelamento/publicação atômicos e replay. Testar com pool, roles reais e RLS se adotada. Confirmar versão do servidor; não substituir esses testes por banco em memória.

**Adapters:** contratos HTTP/MCP com schemas homologados; token expirado, 403, 429, 5xx, stream interrompido, resposta acima do limite, resultado parcial e query aceita sem token persistido. Usar simulador para caos; smoke read-only no tenant autorizado apenas com quota específica.

**Web:** cenários de navegação e acessibilidade, mapa/lista equivalentes, estados vazios/ambíguos/parciais, filtros sem chamadas remotas e ausência de saltos de layout. Benchmark com 50, 200 e 500 nós, grafos com ciclos e rótulos longos em dispositivos dos usuários. Testar 1366×768 e 1920×1080, zoom de 200%, contraste e modo de movimento reduzido.

**Operação:** carga concorrente, justiça entre usuários, breaker por conector, worker perdido, banco temporariamente indisponível, watchdog atrasado, limpeza de ledger/leases e restore. Tempo até resultado e consumo devem ser medidos em cenário representativo antes de assumir SLO de produção.

## 5. Metas iniciais a validar

| Indicador | Meta de produto para piloto |
| --- | --- |
| Baseline disponível | p95 até 2 s quando existe snapshot e banco saudável |
| Primeira topologia nova | Meta p95 até 15 s em escopo padrão e tenant responsivo |
| Interação local | Meta p95 até 150 ms nos filtros do conjunto de referência |
| Duração automática | Até 120 s ativos; estado terminal conforme watchdog e disponibilidade local |
| Trabalho causado por filtro/replay | Zero requests ao Dynatrace |
| Crescimento de clientes MCP | Limitado ao registry configurado, sem crescimento por sessão de busca |
| Perda de resultado por queda SSE | Zero; snapshot recuperável no banco |
| Segurança de informação | Zero compartilhamento entre fronteiras não equivalentes |

Essas são metas a medir, não resultados obtidos nesta entrega. Meta não atingida gera revisão de plano/renderização/limites, não extensão silenciosa do deadline.

## 6. Evolução após o MVP

Conforme evidência de uso: janelas temporais incrementais com overlap controlado, migração de runs privados para trabalho compartilhado depois de seleções independentes, cache segmentado, mais fontes de infraestrutura, comparação temporal avançada, rotinas agendadas com quota própria, integração de incidentes e exportação. No MVP, somente runs cuja raiz já estava confirmada na criação são compartilháveis. Extração de serviços ou adoção de workflow engine exige necessidade demonstrada de escala/recuperação.

Remediação e ferramentas com escrita requerem novo SDD, autorização e modelo de risco. A disponibilidade atual de MCP não autoriza expandir automaticamente o conjunto de ferramentas.

## 7. Limite da verificação atual

A primeira entrega do SDD validou consistência documental, referências locais e arquivos JSON. O incremento posterior em `web` implementa uma prévia com dados fictícios e tem seu [registro de verificações](../../web/REVIEW.md). Build Java, migrations, integração com banco/tenant, conexão MCP, queries privadas e medição de custo continuam pendentes. Testes do frontend não validam a máquina de estados do serviço planejado.
