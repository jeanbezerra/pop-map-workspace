# Porto Observability Platform — Map Web

Frontend de revisão para SRE e ERT, com Next.js App Router, React, Fluent UI React v9 (Fluent 2) e React Flow. A interface usa dados de demonstração e não consulta o Dynatrace, MCP ou o serviço Java neste incremento.

**POP** significa **Porto Observability Platform**; **Map** é o nome deste componente. O cabeçalho apresenta primeiro o logo Porto, depois a plataforma e o componente. Os filtros têm rolagem própria no desktop e usam drawer em telas menores, preservando os valores ao alternar a apresentação.

O código fica em `web` para ser transferido para a raiz do projeto `react-ssr-corp-srep-pop-map` gerado pelo template corporativo. A compatibilidade estrutural é viável; autenticação, Helm e pipeline dependem da homologação do template real. Veja a [análise de compatibilidade](../docs/sdd/09-compatibilidade-template-web.md).

## Executar para revisar

Pré-requisito recomendado: Node.js 24 LTS e npm compatível. O ambiente de implementação usa Node 24.19.0. Não reutilize uma imagem Node antiga sem verificar os requisitos das dependências.

Na pasta `web`:

```powershell
npm ci
npm run dev
```

Abra [POP Map local](http://localhost:3000/react-ssr-corp-srep-pop-map). O prefixo corporativo faz parte da aplicação também no ambiente local.

Abrir apenas `http://localhost:3000` também funciona: a raiz redireciona para o prefixo da aplicação, mantendo o mesmo host.

Comandos do projeto:

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção e preparação dos assets standalone pelo postbuild |
| `npm start` | Executa o servidor standalone preparado, após o build |
| `npm run start:standalone` | Alias explícito para o mesmo runtime standalone |
| `npm run start:next` | Diagnóstico com `next start`; não é o entrypoint do artefato standalone |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sem emissão |
| `npm test` | Verificações de comportamento implementadas neste incremento |

O resultado de cada verificação deve ser consultado na entrega; a presença do script não significa que uma integração externa foi validada.

## Versões e estrutura

Versões estáveis verificadas no registro npm em 28/10/2026 para esta implementação:

| Pacote | Versão selecionada |
| --- | --- |
| `next` | 16.4.3 |
| `react` / `react-dom` | 19.3.1 |
| `@fluentui/react-components` | 9.75.0 |
| `@fluentui/react-icons` | 2.0.344 |
| `@xyflow/react` | 12.12.0 |

Ferramentas usam as versões estáveis compatíveis: o compilador TypeScript 7.0.2 roda pelo alias `@typescript/native`; TypeScript 6.0.3 fornece a API exigida por Next/ESLint. Esse funcionamento lado a lado segue a [orientação oficial do TypeScript](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0). O comando `typecheck` aponta explicitamente para o compilador 7, sem depender da ordem dos executáveis no npm.

ESLint está fixado em 9.39.5 porque os plugins do `eslint-config-next` selecionado ainda não aceitam ESLint 10 nos peers. Essa é uma exceção de compatibilidade das ferramentas: a linha 9 foi marcada como sem suporte pelo registro. Atualizar a cadeia de plugins/lint assim que houver um conjunto compatível; não instalar com `--force` ou esconder erros de peer para apenas aumentar a versão. Next, React e Fluent permanecem nas versões estáveis mais recentes verificadas. Consulte o [registro de validação](REVIEW.md).

`package.json` e `package-lock.json` registram o conjunto efetivamente instalado. Não substituir versões por `latest` no pipeline: a atualização é uma mudança revisável, seguida de tipos, testes e build.

O Fluent usa provider/tema e renderização de estilos compatíveis com SSR. A identidade visual e os componentes de produto são compostos sobre as APIs públicas do Fluent; o grafo permanece uma região especializada da interface.

O registry em `src/app/providers.tsx` emite o CSS uma única vez por instância no streaming do App Router. Não remover essa proteção: cada chamada de `renderToStyleElements()` retorna a folha acumulada, e a repetição pode gerar cópias em `body`. Há testes de regressão específicos em `__tests__/providers.test.tsx`.

## Contrato de empacotamento

O projeto preserva o contrato observado nas imagens:

```text
nome:     react-ssr-corp-srep-pop-map
basePath: /react-ssr-corp-srep-pop-map
distDir:  dist/react-ssr-corp-srep-pop-map
output:   standalone
porta:    3000
```

`postbuild` copia os assets públicos e estáticos para o artefato standalone. Essa cópia usa um script Node para funcionar em Windows e Linux; o script evita depender da sintaxe de um shell ou da versão de `copyfiles`.

`scripts/start-standalone.mjs` inicia o `server.js` preparado; a imagem corporativa deve executar o mesmo artefato. `next start` não é o entrypoint standalone. [Next.js — output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).

O ingress deve encaminhar o prefixo corporativo até o Next sem removê-lo. O prefixo é definido no build e não muda só por alterar o ConfigMap. [Next.js — basePath](https://nextjs.org/docs/app/api-reference/config/next-config-js/basePath).

## Sobrepor ao projeto gerado pelo Backstage

Faça a transferência em uma branch do projeto corporativo, mantendo um diff revisável:

1. Copie `src`, `public` e `scripts` desta pasta, revisando colisões com páginas/rotas existentes.
2. Mescle `package.json`, `next.config.ts`, TypeScript, lint e configuração de testes. Leve o lockfile compatível e execute `npm ci` no registro permitido.
3. Preserve a `.npmrc` corporativa, as regras de acesso ao registro, CI/CD, imagem de runtime, catálogo Backstage e configuração real dos ambientes.
4. Preserve o `pom.xml` corporativo se ele possuir parent ou plugins; o arquivo desta pasta contém somente as coordenadas observadas nas imagens.
5. Compare os exemplos `config/values_*.yaml` com o schema do chart real. Não sobreponha hosts, referências de segredo e políticas de produção por placeholders.
6. Valide build, entrypoint, URL com prefixo, assets, health checks e autenticação em homologação antes da promoção.

Não copiar `node_modules`, `dist`, caches, `.env.local`, credenciais ou arquivos `target` para o repositório corporativo. Uma build produzida no Windows não substitui a build Linux da imagem de produção.

## Autenticação e serviço

As imagens mostram integração Keycloak/NextAuth e `API_URL`. Esta primeira revisão visual não implementa login, autorização corporativa, proxy para o serviço nem persistência de sessões no PostgreSQL. Os exemplos de configuração reservam os nomes necessários para a integração posterior.

`API_URL`, `KEYCLOAK_CLIENT_SECRET` e `NEXTAUTH_SECRET` permanecem no servidor, injetados pelo mecanismo de segredos/ambiente da plataforma; não usar prefixo `NEXT_PUBLIC_` para eles. Variáveis públicas são incorporadas ao JavaScript entregue ao navegador. [Next.js — environment variables](https://nextjs.org/docs/app/guides/environment-variables).

Ao habilitar NextAuth, usar a URL completa com o caminho de autenticação, por exemplo `https://host-aprovado/react-ssr-corp-srep-pop-map/api/auth`, e registrar o callback correspondente no cliente Keycloak. A compatibilidade de `SessionProvider` e do provider precisa ser testada com o prefixo. `NEXTAUTH_LOGOUT` é uma convenção do template, não uma configuração que implemente logout federado automaticamente. [NextAuth — options](https://next-auth.js.org/configuration/options), [Keycloak provider](https://next-auth.js.org/providers/keycloak).

Os arquivos YAML contêm apenas exemplos de estrutura e destinos `.example.invalid`. Não incluem hosts internos ou segredos das capturas. O valor de secret reference é um marcador para substituir pelo mecanismo corporativo, não uma senha padrão.

## Limites desta revisão

O frontend permite avaliar leitura do mapa, filtros, estados, detalhes e ajuda. Não demonstra observabilidade real, autenticação de produção, integração API/MCP, chart renderizado ou implantação no Backstage. O [SDD](../docs/sdd/README.md) continua definindo os invariantes do serviço e da coleta governada.

O ambiente `APP_MODE` fica reservado para a integração; neste incremento a tela é sempre demonstrativa. A seleção de ambiente/período altera o contexto da simulação, não carrega telemetria diferente. O histórico local guarda no máximo 20 sessões e não equivale aos snapshots imutáveis do backend planejado. Query strings e fragmentos não são guardados nesta prévia; suporte a rotas SPA/hash exige o resolver real.
