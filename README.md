# Porto Observability Platform — Map

Especificação para descobrir e explorar componentes de uma aplicação monitorada no Dynatrace, a partir de uma URL, com Web, serviço Java/Spring Boot e PostgreSQL 18.

**POP** significa **Porto Observability Platform**. **Map** é o componente de exploração de aplicações da plataforma.

**Entrega atual:** SDD pesquisado e frontend de revisão em [web](web/README.md), com Next.js, React, Fluent 2 e mapa interativo. A prévia usa dados fictícios; integração com tenant/serviço, autenticação corporativa e migrations ainda não foram implementadas.

Para revisar a interface, na pasta `web`, execute `npm ci` e `npm run dev`. Abra [POP Map local](http://localhost:3000/react-ssr-corp-srep-pop-map). Há filtros, lista, ajuda contextual, evidências, busca/cancelamento simulados e histórico neste navegador. Consulte a [compatibilidade e sobreposição ao template](docs/sdd/09-compatibilidade-template-web.md).

Comece pelo [SDD-001](docs/sdd/README.md). A especificação divide produto, experiência, coleta, orquestração, dados e critérios de aceite; inclui políticas e máquina de estados em JSON para orientar a implementação.

| Documento | Conteúdo |
| --- | --- |
| [SDD-001](docs/sdd/README.md) | Objetivo, requisitos, arquitetura e decisões |
| [Experiência](docs/sdd/01-experiencia.md) | Perguntas, mapa em tela inteira, filtros, estados e acessibilidade |
| [Coleta Dynatrace e MCP](docs/sdd/02-coleta-dynatrace-mcp.md) | Resolução de URL, componentes, evidências e conectores |
| [Orquestração e custos](docs/sdd/03-orquestracao-governanca.md) | Execução finita, conexões, cache, concorrência e orçamento |
| [Dados e contratos](docs/sdd/04-dados-contratos.md) | PostgreSQL 18, entidades, API e eventos |
| [Aceite e implementação](docs/sdd/05-aceite-plano.md) | Cenários, entregas incrementais e gates |
| [Pesquisa e decisões pendentes](docs/sdd/06-pesquisa.md) | Fontes oficiais, limites da pesquisa e validações no tenant |
| [Desempenho e resiliência](docs/sdd/07-desempenho-resiliencia.md) | RED, problemas Dynatrace, baselines, dependências e riscos condicionais |
| [Mapa e ajuda para SRE/ERT](docs/sdd/08-mapa-sre-ert-ajuda.md) | Legibilidade, triagem, legenda e catálogo contextual de tipos |
| [Compatibilidade Web](docs/sdd/09-compatibilidade-template-web.md) | Next/Fluent, standalone, basePath e sobreposição ao template Backstage |
| [Política de exemplo](docs/sdd/discovery-policy.example.json) | Limites iniciais propostos, sujeitos a calibração |
| [Máquina de estados](docs/sdd/discovery-state-machine.json) | Estados e transições permitidas da execução |
| [Cenários SDD](docs/sdd/acceptance.feature) | Comportamentos verificáveis; ainda sem implementação dos steps |

Data de referência: **28/10/2026**. Os números da política são decisões de projeto, não limites publicados pelo Dynatrace nem promessa de preço ou desempenho.
