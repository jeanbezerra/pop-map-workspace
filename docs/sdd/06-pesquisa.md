# Pesquisa, evidências e pendências

Consulta às fontes: 28/10/2026. Foram usadas fontes oficiais Dynatrace, MCP, Spring, PostgreSQL, WHATWG, W3C e Cytoscape.js. O usuário confirmou SaaS/Grail/MCP disponíveis e foco em desempenho e resiliência; não houve acesso autenticado ao tenant nesta pesquisa.

## 1. Conclusões e implicações

| Tema | Fato documentado / limite | Decisão de projeto |
| --- | --- | --- |
| Topologia | API clássica está em migração | Smartscape primeiro; compatibilidade clássica explícita |
| URL | Host/path não identifica necessariamente uma aplicação ou serviço | Resolver por evidências e confirmar candidatos |
| Rota | Relação frontend/serviço pode abranger várias rotas | Guardar escopo e não atribuir causalidade/rota por herança |
| Histórico | Smartscape é mutável e tem retenção própria | Persistir snapshots do conhecimento obtido pelo produto |
| MCP/Assist | MCP expõe tools; isso não prova API da conversa/contexto do Assist | Integrar ferramentas permitidas, sem pressupor automação da UI |
| Protocolo | Revisões MCP têm lifecycles diferentes | Homologar SDK/servidor e não impor sessão permanente |
| Custo | IA, tools e leitura de dados têm dimensões diferentes | Ledger multidimensional, reservas e admissão conservadora |
| Query | Timeouts/limites de resultado do fornecedor podem ser suaves | Watchdog local e limites de leitura/parsing |
| Métricas | Agregação e sampling alteram interpretação | RED primeiro; traces focais; baseline e qualidade explícitos |
| Operação humana | Grafo amplo e cores sem semântica dificultam triagem | Visão por serviços, contexto preservado e ajuda acessível |

As decisões de projeto, números de política e arquitetura modular são propostas deste SDD; não são requisitos impostos pelos fornecedores.

## 2. Fontes oficiais

### Topologia e correlação

- [Monitored entities API](https://docs.dynatrace.com/docs/dynatrace-api/environment-api/entity-v2): orientação de migração do modelo clássico.
- [Smartscape on Grail](https://docs.dynatrace.com/docs/platform/grail/smartscape-on-grail): temporalidade, retenção e condições de consumo.
- [Smartscape core model](https://docs.dynatrace.com/docs/semantic-dictionary/model/smartscape/core): tipos e relações.
- [SaaS 1.343](https://docs.dynatrace.com/docs/whats-new/saas/sprint-343): evolução da ligação frontend/serviço.
- [Frontend configuration](https://docs.dynatrace.com/docs/observe/digital-experience/new-rum-experience/web-frontends/initial-setup/set-up-auto-injected-frontend): regras de associação.
- [RUM user events](https://docs.dynatrace.com/docs/semantic-dictionary/model/rum/user-events) e [requests](https://docs.dynatrace.com/docs/semantic-dictionary/model/rum/user-events/requests): campos, URL e correlação.
- [Frontend/backend linking](https://docs.dynatrace.com/docs/observe/digital-experience/rum/analyze-and-alert/analyze-frontend-to-backend): limites de instrumentação e propagação.

### Execução, consumo e identidade

- [Grail service](https://developer.dynatrace.com/develop/platform-services/services/grail-service/): execução assíncrona e recuperação.
- [Query API reference](https://developer.dynatrace.com/develop/sdks/client-query/v1/) e [changelog](https://developer.dynatrace.com/changelogs/sdks/client-query/): parâmetros e evolução de capacidades.
- [DQL data source commands](https://docs.dynatrace.com/docs/platform/grail/dynatrace-query-language/commands/data-source-commands) e [best practices](https://docs.dynatrace.com/docs/platform/grail/dynatrace-query-language/dql-best-practices): scan, sampling e eficiência.
- [AI Units](https://docs.dynatrace.com/docs/license/capabilities-classic/appengine-functions/ai-units-classic) e [Standard Function Calls](https://docs.dynatrace.com/docs/license/capabilities/appengine-functions/standard-function-calls): dimensões de consumo; confirmar contrato aplicável.
- [OAuth clients](https://docs.dynatrace.com/docs/manage/identity-access-management/access-tokens-and-oauth-clients/oauth-clients) e [IAM statements](https://docs.dynatrace.com/docs/manage/identity-access-management/permission-management/manage-user-permissions-policies/advanced/iam-policystatements): autenticação e escopos.

### MCP e Java

- [Dynatrace MCP](https://docs.dynatrace.com/docs/dynatrace-intelligence/dynatrace-mcp): endpoint, ferramentas e autenticação.
- [Assist](https://docs.dynatrace.com/docs/dynatrace-intelligence/agentic-and-generative-ai/chat-with-dynatrace-assist): experiência do produto.
- [MCP legado arquivado](https://github.com/dynatrace-oss/dynatrace-mcp): razão para não adotar o servidor local anterior.
- [MCP Streamable HTTP 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http), [transporte 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports) e [lifecycle antigo](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle): compatibilidade de protocolo.
- [Cancelamento MCP antigo](https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/cancellation): limites da interrupção remota.
- [SDK Java MCP](https://java.sdk.modelcontextprotocol.io/latest/) e [Spring AI MCP Client](https://docs.spring.io/spring-ai/reference/api/mcp/mcp-client-boot-starter-docs.html): opções de cliente e fronteiras de lifecycle.
- [Spring Boot requirements](https://docs.spring.io/spring-boot/system-requirements.html): compatibilidade para fixar a stack.

### Desempenho e resiliência

- [Response time analysis](https://docs.dynatrace.com/docs/observe/application-observability/services/services-app/response-time-analysis): interpretação da duração e contribuições.
- [Service concepts](https://docs.dynatrace.com/docs/observe/application-observability/services/services-concepts) e [classic failure concepts](https://docs.dynatrace.com/docs/observe/application-observability-classic/services-classic/services-concepts-classic): semântica de requests/falhas.
- [Davis model](https://docs.dynatrace.com/docs/semantic-dictionary/model/davis): problemas e estado de análise.
- [Distributed tracing analytics](https://docs.dynatrace.com/docs/observe/application-observability/distributed-tracing/advanced-tracing-analytics): sampling e extrapolação.

### Persistência e experiência

- [PostgreSQL 18 SELECT](https://www.postgresql.org/docs/18/sql-select.html), [UUID](https://www.postgresql.org/docs/18/functions-uuid.html), [JSON](https://www.postgresql.org/docs/18/datatype-json.html) e [row security](https://www.postgresql.org/docs/18/ddl-rowsecurity.html): base de persistência.
- [Cytoscape.js performance](https://js.cytoscape.org/#performance): renderização e layout de grafos.
- [WHATWG SSE](https://html.spec.whatwg.org/dev/server-sent-events.html): conexão e replay do protocolo Web.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/): acesso por teclado, foco, contraste e mensagens de estado.

## 3. Homologações do incremento I0

| Questão | Como encerrar a pendência |
| --- | --- |
| Release, schemas e relações Smartscape | Capturar capability matrix do ambiente SaaS autorizado |
| Identificação da rota real | Amostra controlada de frontend config/RUM, máscaras, hashes e traces |
| IDs clássicos versus Smartscape | Documentar crosswalk suportado; nunca unir por nome |
| Métricas e problemas | Descobrir indicadores reais, modelo de serviços, view de problemas e lookback |
| SLO/baseline e qualidade | Selecionar aplicação piloto e políticas de comparação com SRE/ERT |
| Grant e permissões API/MCP | Smoke mínimo por identidade; registrar scopes necessários e limitações |
| MCP e SDK | Gravar protocolo, transporte, catálogo/schema hashes e cancelamento demonstrado |
| Tool com consumo interno | Demonstrar limites; caso impossível, mantê-la desabilitada no automático |
| Scan | Homologar unidade, granularidade, frações e conversão conservadora para bytes |
| Rate card e licenciamento | Mapear dimensões e preços do contrato; sem preço inventado |
| Stack | Fixar Java/Spring/SDK/BOM/driver e framework Web compatíveis |
| PostgreSQL | Minor, distribuição, roles, pool, backup/restore e SLOs de operação |
| UX SRE/ERT | Validar nomes, símbolos, densidade e ajuda em sessão de triagem simulada |

Disponibilidade declarada de Grail/MCP não substitui essas homologações. A investigação não realizou requests privados, não criou detectores e não mediu consumo do tenant.
