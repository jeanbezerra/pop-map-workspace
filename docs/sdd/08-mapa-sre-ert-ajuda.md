# Legibilidade do mapa e ajuda para SRE e ERT

Público principal confirmado: **SRE** e **ERT — Emergency Response Team**. O mapa deve apoiar triagem e investigação durante um incidente, com leitura rápida e evidência acessível. A pergunta principal é: **quais componentes conhecidos estão no caminho da aplicação e quais apresentam sinais de degradação no período selecionado?**

Identidade do produto: **Porto → Porto Observability Platform (POP) → Map**. O logo corporativo tem prioridade; o nome da plataforma precede o nome do componente. Não duplicar símbolos de marca ou usar “Application intelligence” no lugar do nome oficial.

## 1. Visão inicial

O modo padrão **Triagem** apresenta a entrada/rota, frontend, serviços e dependências diretas relevantes. Infraestrutura detalhada fica agrupada e recolhida; a pessoa abre esse nível quando a investigação exigir. “Serviços” e “Infraestrutura” são visões do mesmo snapshot, sem coleta adicional.

Mostrar poucas dezenas de grupos/componentes na leitura inicial, como meta de densidade a validar; o teto de 200 nós inicialmente visíveis é proteção, não objetivo de preenchimento. Se houver mais componentes, apresentar grupos e contadores. O mapa não deve começar ajustado a centenas de rótulos ilegíveis.

Cabeçalho sempre visível: aplicação/raiz, ambiente, período observado, idade dos dados, cobertura e estado da coleta. Durante incidente, não alternar contexto, mover nós existentes ou reorganizar por severidade automaticamente. Novas evidências podem atualizar selos e contadores; layout muda por ação explícita.

Achados aparecem numa faixa compacta “Problemas no escopo”, separada de “Hipóteses a verificar”. A ordem usa impacto evidenciado e severidade da fonte, sem transformar oportunidade estrutural em incidente ativo. Painéis e ajuda não bloqueiam a navegação principal.

## 2. Vocabulário visual

Cada nó tem ícone de tipo, nome legível, tipo em texto e um selo de estado. O nome completo fica acessível por foco e drawer; não depender de hover. IDs técnicos, namespace do fornecedor e detalhes de instrumento ficam em “Identificação técnica”. Nós de tipos diferentes usam ícone/forma/rótulo, sem uma cor própria para cada tecnologia.

Reservar cor de destaque para estado/seleção, acompanhada de símbolo e texto:

| Estado | Semântica apresentada |
| --- | --- |
| Problema ativo | Ativo no período observado, com severidade e link; histórico não implica ativo agora |
| Fora do objetivo | Métrica violou SLO/regra configurada e válida |
| Sem violação observada | Regra avaliada no período e sem violação; não significa garantia de saúde total |
| Sem dados | Não há evidência suficiente para avaliar; nunca usar verde |
| Desatualizado | Há observação, mas fora da validade configurada |
| Parcial | A camada/cobertura não foi integralmente obtida |
| Hipótese | Sugestão de investigação ainda não confirmada |

Freshness e saúde são dimensões independentes. Um problema conhecido pode continuar visível com selo “dado desatualizado”. Grupos mostram total, componentes com problema e componentes sem dados; não aplicar verde ao grupo porque um único filho está saudável.

O tamanho do nó não representa criticidade, tráfego ou causalidade por padrão. Espessura da aresta não representa volume sem métrica/unidade explícita. Animações de fluxo não devem sugerir tráfego em tempo real quando a evidência é histórica; ficam desabilitadas no modo de triagem.

## 3. Relações fáceis de interpretar

| Relação | Rótulo na interface | Direção e explicação |
| --- | --- | --- |
| `CALLS` | chama | Chamador → chamado; dependência observada, sem prova automática de causa |
| `RUNS_ON` | executa em | Processo/workload → recurso de execução, conforme modelo da fonte |
| `BELONGS_TO` | pertence a | Componente → grupo/estrutura; não é request de rede |
| Associação configurada | associado por configuração | Estilo distinto; não exibir como chamada observada |
| Hipótese | relação a verificar | Tracejada e opcional; nunca misturada à camada factual sem identificação |

As relações efetivas vêm do modelo Dynatrace e da normalização homologada. Quando o sentido da fonte exigir tradução, registrar o mapeamento e a evidência; não inverter setas para acomodar o layout.

Legenda compacta fica acessível junto ao mapa, com texto “chamador → chamado”. Ao selecionar aresta, mostrar origem, destino, tipo, abrangência, período e evidência. Setas de chamada e linhas de infraestrutura têm estilos distinguíveis também sem cor.

“Destacar chamadores”, “Destacar dependências” e “Mostrar caminho conhecido até a entrada” percorrem somente o snapshot. O último é caminho topológico conhecido; só usar a expressão “caminho observado na requisição” quando houver trace correspondente. Não rotular vizinhança inteira como blast radius confirmado.

## 4. Componente de ajuda

**Nome funcional:** `MapHelpPanel`. Acesso persistente pelo botão **Entenda o mapa**, pela legenda e pela ação **O que é este componente?** no drawer do nó. O botão tem nome acessível, foco visível e não depende de atalho ou hover.

O painel oferece três abas simples:

1. **Tipos de componentes:** catálogo pesquisável, com nome em português e termo técnico original.
2. **Como ler as conexões:** direção, estilos e diferença entre chamada, execução, pertencimento e hipótese.
3. **Estados e limites:** saúde, dados antigos/parciais, sampling, cobertura e atribuição à rota.

Ajuda contextual abre diretamente o tipo do nó selecionado. Cada entrada contém: “O que é”, “O que representa neste mapa”, “Como se relaciona”, “O que verificar” e “Limites da interpretação”. Exibe exemplo e, quando útil, link oficial. O conteúdo é local, versionado, revisável com SRE/ERT e compartilhado entre tooltip, legenda e painel; abrir, pesquisar ou navegar a ajuda gera **zero chamadas API/MCP do Dynatrace**.

O tipo visível e sua descrição usam uma chave estável, como `SERVICE`. Guardar separadamente `providerType` e `displayType`. Uma entidade desconhecida recebe `UNKNOWN` e o tipo bruto no detalhe, sem adivinhar sua função pelo nome. Ocultar descrições de tipos não suportados do catálogo principal, mantendo busca explicativa quando pertinente.

### Catálogo mínimo de ajuda

| Tipo exibido | Descrição e exemplo | Limite essencial para SRE/ERT |
| --- | --- | --- |
| Entrada / rota | Contexto pesquisado, por exemplo `/aplicacao-a`; ponto de partida da investigação | Pode ser nó virtual do produto; não implica entidade Dynatrace nem relação de chamada observada |
| Frontend / aplicação Web | Aplicação instrumentada no navegador, que pode reunir várias páginas e rotas | Relações do frontend inteiro não comprovam uso por uma rota específica |
| Serviço | Componente lógico que recebe/processa requisições, como serviço de cotação Java | Um serviço lógico pode representar muitas instâncias; não é uma réplica |
| Banco de dados | Dependência de dados identificada por telemetria, como serviço/endpoint PostgreSQL | Endpoint lógico não comprova servidor físico, primário/réplica ou topologia de HA |
| Dependência externa | Destino de chamada fora do contexto monitorado, como API de parceiro | Externo ou não monitorado não significa indisponível; destino pode ter visibilidade limitada |
| Grupo de processos | Agrupamento lógico de processos reconhecidos como o mesmo componente | Grupo não é processo individual e não informa sozinho quantidade de réplicas prontas |
| Processo | Instância de programa em execução, como JVM ou processo Node.js | Presença observada não garante saúde, capacidade ou readiness |
| Host | Máquina virtual ou física identificada como recurso de execução | Um host no mapa parcial não prova ponto único de falha |
| Workload Kubernetes | Controlador/agrupamento de execução, como Deployment ou StatefulSet, quando identificado | Réplicas desejadas, existentes e prontas são medidas diferentes |
| Pod Kubernetes | Unidade de agendamento que pode conter vários containers | Pod não é host, serviço lógico nem instância necessariamente pronta para tráfego |
| Container | Instância de runtime isolado que executa parte da aplicação | Container não equivale a serviço ou domínio de falha independente |
| Nó Kubernetes | Recurso computacional que executa pods | Pode corresponder a host também observado; não duplicar por nome sem crosswalk comprovado |
| Cluster Kubernetes | Contexto que agrupa nós e workloads | Um cluster é agrupamento, não componente de request por si só |
| Fila / tópico / mensageria | Dependência assíncrona identificada, como fila, tópico ou broker | Publicação e consumo têm semânticas próprias; não desenhar como chamada síncrona sem evidência |
| Tipo ainda não classificado | Entidade recebida sem mapeamento homologado | Mostrar tipo original e evidência; classificação posterior não deve alterar silenciosamente snapshots antigos |

O catálogo descreve tipos possíveis, sem obrigar que todos apareçam na primeira versão. Renderizar somente tipos sustentados pela evidência e pelo adapter. Descoberta de mensageria não é requisito adicional de integração do MVP.

### Exemplo de ajuda contextual de Serviço

> **Serviço** representa um componente lógico observado no Dynatrace. Neste mapa, “Cotação” recebeu chamadas do frontend durante o período consultado. O nó pode reunir várias instâncias. Consulte latência, falhas e volume no detalhe; abra “Execução” para ver infraestrutura conhecida. A relação atual pertence ao frontend inteiro e ainda não comprova que a rota pesquisada chamou este serviço.

Quando houver dado específico da rota, o texto se adapta ao escopo registrado. O conteúdo geral vem do catálogo; os fatos da entidade vêm do snapshot, sem explicação gerada automaticamente por LLM.

## 5. Redução de ruído com preservação de contexto

- Filtrar “com problema” mantém, por padrão, a entrada e conectores necessários para entender o caminho; componentes de contexto usam estilo secundário, claramente identificado.
- “Ocultar contexto” é opção local explícita. Mostrar quantidade filtrada e quantidade sem dados.
- Infraestrutura agrupada informa o que contém. Expandir dados conhecidos não coleta novamente.
- Pesquisar por nome/ID centraliza e seleciona, preservando o restante do mapa e o histórico de navegação.
- Labels não se sobrepõem na densidade de referência. Quando não couberem, usar agrupamento/zoom semântico e lista; não reduzir texto indefinidamente.
- Métricas detalhadas, atributos e IDs ficam no drawer/tabela; o canvas mantém informação necessária à triagem.

## 6. Critérios de aceite específicos

| ID | Evidência necessária |
| --- | --- |
| UX-01 | Uma pessoa de SRE/ERT identifica raiz, tipo, direção da chamada, idade do dado e próxima evidência em tarefa simulada sem ajuda do facilitador. Medir tempo e erros e calibrar meta no piloto. |
| UX-02 | Todos os tipos renderizados têm descrição, exemplo e limite de interpretação no `MapHelpPanel`; `UNKNOWN` tem fallback explícito. |
| UX-03 | Ajuda abre por teclado e botão contextual, conserva foco corretamente e permite retorno ao nó. Nenhuma informação essencial depende de hover. |
| UX-04 | Ajuda, legenda, filtros e destaque de caminhos não aumentam calls Dynatrace/MCP em nenhuma etapa. |
| UX-05 | Não há colisão de rótulos na visão inicial de referência; grafo denso agrupa antes de tornar texto ilegível. |
| UX-06 | Usuário distingue “sem dados”, “sem violação”, “desatualizado”, “parcial” e “hipótese” sem depender de cor. |
| UX-07 | Novos lotes não movem nós existentes, foco, seleção ou zoom durante a triagem. |
| UX-08 | Grupos recolhidos não escondem que há componentes com problema ou sem dados. |
| UX-09 | Leitura principal e ajuda funcionam em 1366×768, 1920×1080 e zoom de 200%, com painéis recolhíveis e tabela equivalente. |
| UX-10 | Uma relação observada, hipótese de causa e causa atribuída pelo Dynatrace têm textos/estilos distintos. |

A implementação será inspecionada visualmente e com público real. O SDD define o comportamento; não representa uma tela já renderizada ou validada. A base de acessibilidade é [WCAG 2.2](https://www.w3.org/TR/WCAG22/); a densidade precisa de benchmark próprio, além das recomendações de [performance do Cytoscape.js](https://js.cytoscape.org/#performance).
