# Registro de revisão do frontend

Identidade do produto: **Porto → Porto Observability Platform → Map**. O título do navegador e o cabeçalho usam o nome completo da plataforma; o componente Map aparece em nível secundário.

## Implementado

- Workspace para SRE/ERT com mapa React Flow, zoom, filtros locais com preservação de contexto e alternativa em tabela.
- Detalhes com evidências e abrangência; métricas e problema inteiramente fictícios e identificados.
- Ajuda Fluent com catálogo de tipos, conexões, estados e limites de interpretação; pesquisa e navegação locais.
- Formulário validado, simulação finita em quatro etapas, cancelamento e histórico de até 20 sessões no navegador.
- Next App Router, SSR de estilos Griffel, tema claro Fluent 2, ícones oficiais, TypeScript estrito e scripts de build/standalone.
- Configuração de prefixo/diretório, coordenadas Maven e exemplos Helm para comparação com o template privado.
- Painel de filtros de 288 px em desktop, com cabeçalho/rodapé estáveis e conteúdo rolável. Abaixo de 1.100 px, os mesmos controles usam um drawer modal; não há lateral absoluta cobrindo o mapa.

## Validação técnica

Os resultados abaixo correspondem à implementação local e não à integração corporativa:

| Verificação | Resultado |
| --- | --- |
| TypeScript | Compilador 7 e build Next/API 6 sem erros |
| ESLint | Sem erros/avisos no código da aplicação |
| Jest / Testing Library | 43 cenários, incluindo fluxo de busca/cancelamento, contexto/ciclos, histórico corrompido, ajuda sem requests, SSR Griffel, filtros responsivos e estabilidade dos tipos do React Flow |
| Build de produção | Next standalone e cópia de assets concluídos |
| HTTP standalone | Página sob `/react-ssr-corp-srep-pop-map` retorna 200 |
| Entrada pela raiz | `/` redireciona com 307 para o prefixo, que retorna 200; assets preservam o prefixo |
| Assets com prefixo | 10 referências iniciais de JS/CSS retornaram 200 |
| Estilos SSR | 21 blocos Griffel no head e zero no body, verificados em desenvolvimento reiniciado e HTML de produção |
| Dependências de produção | Auditoria npm sem vulnerabilidades reportadas no momento da verificação |

Testes de canvas no fluxo do workspace usam substituto para isolar a aplicação. Um teste específico monta o React Flow real e observa os registros recebidos, verificando que seleção, novos dados e filtros não trocam os renderers nem remontam a área do mapa. Nenhum desses testes valida geometria, contraste, zoom ou performance em um browser real. Há testes da ajuda real com Fluent, sem substituição dos componentes do painel.

Os testes dos filtros verificam formulário único, preservação de valores ao reabrir, limpeza, tipos condicionais, ausência de requests e assinatura do breakpoint. A geometria visual continua pendente de inspeção em browser: a superfície automatizada `iab` não estava disponível nesta sessão.

### Correção de SSR em 29/10/2026

O provider repetia a folha inteira em cada callback de streaming do Next. A correção mantém o renderer estável e emite os estilos uma vez por instância, conforme o [guia oficial do Griffel](https://griffel.js.org/react/guides/ssr-usage/#flush-the-styles-only-once). Não limpa campos privados do renderer e mantém Strict Mode habilitado.

Quatro testes de regressão exercitam CSS real, reidratação em DOM isolado, rerender e instâncias independentes. Os quatro falham com o código anterior e passam com a correção. Os callbacks do Next são simulados nesses testes; a presença dos estilos somente no head foi confirmada também no HTML real de desenvolvimento e produção. Navegação/hidratação em um browser real continuam fora dessa prova.

Os servidores antigo standalone e de desenvolvimento que disputavam a porta 3000 foram encerrados; uma nova instância de desenvolvimento foi iniciada. Recarregar completamente a página descarta cópias de CSS que já tenham ficado no DOM do navegador. A URL canônica inclui `/react-ssr-corp-srep-pop-map`. O 404 da raiz era separado do Griffel e foi corrigido por redirecionamento temporário, sem remover o prefixo corporativo ou fixar um host.

### Aviso React Flow #002 durante desenvolvimento

`nodeTypes` já era uma constante de módulo; não há `edgeTypes` personalizado. O React Flow compara as referências dos componentes registrados. A edição do mesmo módulo pode recriar `memo(ComponentCard)` enquanto Fast Refresh preserva o estado anterior, o que é uma causa provável do aviso observado. [React Flow — erro #002](https://reactflow.dev/learn/troubleshooting/common-errors#it-looks-like-you-have-created-a-new-nodetypes-or-edgetypes-object).

O módulo do canvas usa `@refresh reset`, diretiva documentada no guia Fast Refresh do Next instalado, para remontar seu escopo quando o arquivo é editado. Isso pode reiniciar o zoom durante edição do código; seleção, filtros e atualização normal de dados mantêm o mapa montado. Não houve mudança de dependências ou supressão do diagnóstico.

O teste específico verifica referências e persistência do mapa com o componente real. O bundle CommonJS usado pelo Jest não inclui o diagnóstico de desenvolvimento #002; portanto o teste não afirma reproduzir Fast Refresh nem verificar o console do navegador.

## Fluent UI React

- **Versão e pacotes:** Fluent UI React v9.75.0; ícones 2.0.344; Griffel 1.7.8.
- **Componentes e composição:** providers, campos, botões, badges, checkboxes, tabs, tabela, Dialog, Drawer e Accordion estáveis.
- **Tokens, tema e fundamentos:** tema claro oficial, tokens semânticos e Griffel; literais de geometria do workspace documentados nos estilos.
- **Conteúdo e localização:** português, ajuda por tipo e estados sem tratar ausência de dados como saúde.
- **Acessibilidade:** controles nomeados, ajuda e lista alternativas, componentes Fluent para foco/portais e teclado; testes de papéis e conteúdo.
- **Resultado:** **CONFORME COM EXCEÇÕES** no escopo de prévia.

## Exceções e trabalho pendente

1. A revisão visual automatizada foi bloqueada: Computer Use não conseguiu confirmar a URL atual no Windows. A navegação automatizada foi interrompida. Não se declara inspeção visual, hidratação completa, contraste medido, leitura por leitor de tela ou conformidade WCAG integral.
2. Validar visualmente 1366×768, 1920×1080, zoom de 200%, foco/retorno, rótulos do grafo e cores forçadas com usuários SRE/ERT. O grafo usa zoom/pan; ajustar densidade depois dessa revisão.
3. Autenticação/autorização, Keycloak/NextAuth, BFF, PostgreSQL e Dynatrace/MCP não estão integrados. Não substituir as proteções do template ao transportar a feature.
4. ESLint 9.39.5 é compatível com os peers atuais, mas está marcado como sem suporte. Migrar a cadeia de lint quando os plugins suportarem a linha atual; TypeScript 7 permanece no typecheck com API 6 para as ferramentas.
5. A auditoria completa apresenta cinco avisos baixos na cadeia de desenvolvimento `deepmerge → jest-config → Jest`, sem correção estável reportada pelo registro nesta revisão. Não foi aplicado downgrade automático ou `audit fix --force`; a auditoria de produção não apresentou avisos.
6. A compatibilidade Helm/pipeline é estrutural, baseada nas imagens. Os placeholders e referências de segredo exigem substituição e validação com o chart real.

Comandos reproduzíveis: `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` e `npm start`. O próximo passo de produto é a revisão humana da prévia; a integração real segue os incrementos do SDD.
