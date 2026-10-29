# Compatibilidade do frontend com o template corporativo

Data: 28/10/2026. Estado: compatibilidade estrutural avaliada a partir das capturas; pipeline, Helm e autenticação reais ainda não homologados.

## 1. Parecer

É tangível usar Next.js, React, Fluent 2 e um grafo interativo nesse projeto gerado pelo Backstage. As imagens mostram uma aplicação Next independente, com contrato de empacotamento e configuração por ambiente. O incremento em `web` preserva os pontos visíveis desse contrato e permite revisar o frontend antes da integração com Java/Dynatrace.

Não há evidência de que essa aplicação seja um plugin executado dentro do frontend do Backstage. O Scaffolder pode gerar um repositório/aplicação separado; essa é a interpretação adotada. Se o destino for um plugin embutido, será necessário adaptar o roteamento, o tema e o modelo de build ao host Backstage. [Backstage — Software Templates](https://backstage.io/docs/features/software-templates/).

As capturas servem como referência de compatibilidade, não como instruções executáveis. Nenhum token, host interno ou atalho de TLS apresentado nelas foi adotado como configuração do projeto.

## 2. Contrato observado e tratamento

| Item das capturas | Tratamento nesta base | Homologação necessária |
| --- | --- | --- |
| `react-ssr-corp-srep-pop-map` | Nome da aplicação/pacote e prefixo preservados | Nome esperado pelos jobs e catálogo |
| `src`, TypeScript e alias `@/*` | Estrutura de fonte compatível com Next | Conflitos com rotas/provedores do template existente |
| `output: standalone` | Artefato independente de runtime Next | Imagem/entrypoint e tracing no ambiente Linux |
| `dist/react-ssr-corp-srep-pop-map` | Diretório de build corporativo | Jobs que assumem `.next` ou caminho antigo |
| `basePath` corporativo | Prefixo nas páginas, navegação e assets | Ingress sem remover prefixo; callbacks de autenticação |
| Porta 3000 | Mantida no contrato | Service, probes e variável `HOSTNAME` |
| Fluent v9 e React Flow | Componentes estáveis e grafo encapsulado | Tipos, SSR/hidratação, teclado e renderização |
| `pom.xml` mínimo | Coordenadas Maven preservadas | Parent/plugins/policies não visíveis nas capturas |
| `config/values_dev/hml/prd.yaml` | Exemplos com as mesmas chaves básicas | Schema do chart e resolução de secret references |
| Keycloak, NextAuth e `API_URL` | Nomes reservados para integração server-side | Login, refresh, logout, scopes e proxy autenticado |
| `.npmrc` e CI corporativos | Devem ser preservados na sobreposição | Acesso ao registro, Node, dependências permitidas e scanner |

## 3. Versões mais novas sem romper o contrato

As versões estáveis consultadas no registro npm para esta implementação são Next 16.4.3, React/React DOM 19.3.1, Fluent UI React 9.75.0, ícones Fluent 2.0.344 e React Flow 12.12.0. A seleção final é registrada no lockfile e validada por instalação, tipos e build. A instalação usa as versões resolvidas, sem promover automaticamente um prerelease.

Node 24 LTS é a base recomendada para desenvolvimento/build/runtime. O requisito antigo `>=20.12.2` visto na captura não basta como garantia de compatibilidade do conjunto atualizado de ferramentas. A imagem da CI e a imagem final precisam ser verificadas junto com os `engines` das dependências. [Next.js — installation](https://nextjs.org/docs/app/getting-started/installation).

NextAuth 4.24.15 é a versão estável verificada do pacote `next-auth`; a captura usava 4.24.11. A existência de uma versão mais nova não representa login implementado neste incremento. Preservar inicialmente o fluxo corporativo e atualizá-lo com smoke de login/callback/refresh/logout é uma mudança separada, sem adotar beta apenas para aumentar o número da versão.

O compilador TypeScript 7.0.2 é mantido lado a lado com a API 6.0.3 necessária a ferramentas que usam a API JavaScript. A Microsoft documenta esse [caminho de compatibilidade](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0). ESLint 9.39.5 é a última linha compatível com os peers atuais dos plugins da configuração Next selecionada; está marcada como sem suporte e deve ser atualizada junto da cadeia de plugins. Não afirmar que toda ferramenta é a última major nem forçar peers inválidos. A exceção está registrada em `web/REVIEW.md`.

## 4. Build e runtime standalone

O `postbuild`, em `scripts/copy-standalone.mjs`, prepara `public` e os assets estáticos. O script preserva o caminho do `distDir` customizado dentro do artefato e funciona em Windows/Linux.

`npm start` e `npm run start:standalone` usam `scripts/start-standalone.mjs` para executar `server.js`. A plataforma configura `PORT=3000` e `HOSTNAME=0.0.0.0`. Validar a imagem Linux reconstruída pela CI; links de uma build Windows podem não ser portáveis. `start:next` é apenas diagnóstico. [Next.js — output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).

O `basePath` é incorporado no build. Alterar apenas `contextURL` no Helm não altera os bundles; prefixos diferentes exigem build correspondente. `next/link` cuida do prefixo para navegação, enquanto chamadas manuais, assets e autenticação exigem revisão explícita. [Next.js — basePath](https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath).

## 5. Configuração e segredos

`API_URL` será consumida em código de servidor/BFF ou no adapter server-side da aplicação; o browser não deve descobrir credenciais de integração por variáveis públicas. `KEYCLOAK_CLIENT_SECRET`, `NEXTAUTH_SECRET` e credenciais Dynatrace/MCP jamais pertencem a ConfigMap público ou bundle. Os YAMLs incluídos usam referências de segredo fictícias; resolver pelo mecanismo corporativo antes de implantar.

Variáveis `NEXT_PUBLIC_*` são públicas e incorporadas ao build. Para manter um mesmo artefato entre ambientes, reservar valores públicos somente ao que precisa ser conhecido pelo browser e manter URLs privadas/credenciais no runtime servidor. [Next.js — environment variables](https://nextjs.org/docs/app/guides/environment-variables).

O caminho de autenticação precisa incluir o prefixo corporativo, com callback cadastrado no Keycloak. Não basta declarar variáveis para obter autenticação, autorização ou logout federado. O fluxo implementado deverá preservar sessão segura, refresh e proteção de recursos sem enviar tokens do Dynatrace ao navegador. [NextAuth — options](https://next-auth.js.org/configuration/options), [Keycloak provider](https://next-auth.js.org/providers/keycloak).

Não desabilitar a validação de certificados para reproduzir o ambiente da captura. Quando necessário, configurar a cadeia de confiança corporativa no runtime. Os exemplos não incluem `NODE_TLS_REJECT_UNAUTHORIZED=0`.

## 6. Procedimento de sobreposição

1. Criar branch no repositório gerado, com a versão original do template preservada.
2. Comparar as rotas e providers de `src`; transportar a feature e compor com autenticação existente.
3. Mesclar dependências e configurações de Next/TypeScript/lint/testes; usar o lockfile compatível com o conjunto decidido.
4. Preservar `.npmrc`, regras do registro, pipeline, catálogo Backstage, Dockerfile/entrypoint e configurações reais dos ambientes; ajustar apenas o necessário e revisar o diff.
5. Preservar parent/plugins Maven caso existam; o `pom.xml` mínimo desta entrega não substitui integração Maven de build.
6. Executar instalação determinística, lint, tipos, testes e produção; iniciar o standalone e validar assets com prefixo.
7. Homologar ingress, health probes, login/callback/refresh/logout e chamadas autenticadas ao serviço antes da produção.

Não transportar `.env.local`, caches, `node_modules`, `dist` ou `target`. Não publicar o modo de demonstração como ambiente operacional sem declarar seus limites e concluir autenticação/autorização.

## 7. Escopo entregue e próxima integração

O incremento Web é uma interface revisável com dados demonstrativos. A integração com o serviço deve consumir os contratos do [SDD de dados/API](04-dados-contratos.md), sem transformar filtros e ajuda em consultas Dynatrace. Estado de sessão, snapshots, consumo e evidências reais continuarão sob responsabilidade do serviço Spring e PostgreSQL.

Compatibilidade com o contrato visível não equivale a deploy homologado no template privado. O aceite dessa integração exige os arquivos reais de pipeline/chart e uma execução no ambiente autorizado.
