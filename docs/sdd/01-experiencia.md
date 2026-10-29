# Experiência de busca e exploração

## 1. Perguntas progressivas

O onboarding do ambiente é administrativo: endpoint aprovado, organização, autenticação, escopos, grupos autorizados e orçamento. A pessoa que consulta o mapa não fornece token nem responde a perguntas de protocolo.

| Ordem | Pergunta | Comportamento |
| --- | --- | --- |
| 1 | Qual URL ou aplicação você quer mapear? | URL completa ou seleção do catálogo. Mostrar normalização antes de executar. |
| 2 | Em qual ambiente? | Só ambientes autorizados; autopreencher quando existir um único. Nunca inferir produção pelo domínio. |
| 3 | O que deseja investigar? | Padrão confirmado: desempenho e resiliência; componentes e lacunas dão contexto. |
| 4 | Qual período? | Padrão proposto: última hora, resolvida em intervalo absoluto. Outras janelas mostram maior custo potencial. |
| 5 | Qual aplicação corresponde à URL? | Somente se houver ambiguidade; exibir candidatos com motivo e abrangência. |

Profundidade, limite de componentes e enriquecimento usam o perfil governado “Padrão”. O usuário pode abrir detalhes antes da busca. Ampliação além do perfil depende da permissão correspondente e de uma ação explícita. Não há formulário inicial com todos os filtros técnicos.

Exemplo de confirmação:

> Mapear `portoseguro.com.br/aplicacao-a` em Produção, no período 10:00–11:00. Até 2 níveis de dependências. Usar dados conhecidos e atualizar o que estiver vencido. Enriquecimento MCP será usado se houver lacunas e orçamento disponível.

Os horários são apresentados no fuso da pessoa; os contratos persistem instantes UTC. Nenhuma URL de aplicação é acessada por crawler no MVP.

## 2. Sequência da experiência

1. A busca cria a sessão e abre a área de exploração.
2. Se houver snapshot autorizado, ele aparece com “Conhecido até …”, cobertura e origem. A atualização não apaga o mapa exibido.
3. A faixa de progresso informa a etapa real, resultados obtidos, tempo e limites. Sem percentual baseado em tempo decorrido.
4. Em ambiguidade, a tela conserva o conhecido e apresenta a seleção. Não mantém operação remota, worker, lease ou slot durante a espera; o lifecycle do cliente/pool MCP do ambiente é independente.
5. Resultados entram em lotes consistentes; novas entidades não reposicionam todo o mapa a cada evento.
6. No encerramento, exibir resultado completo/parcial, motivo, alterações e ações possíveis.
7. Reabrir a sessão recupera o mesmo snapshot final. O botão “Atualizar” cria uma nova sessão vinculada.

Se não houver associação confiável, mostrar “Não foi possível associar esta rota com as evidências disponíveis”, os conectores consultados e a opção de indicar uma aplicação. Evitar a conclusão “aplicação não existe”.

## 3. Mapa em tela inteira

```text
┌ URL/aplicação · ambiente · período ── Sessões · Comparar · Atualizar ┐
│ Etapa atual · idade dos dados · cobertura · consumo · Cancelar      │
├──────────────┬───────────────────────────────────┬─────────────────┤
│ Filtros      │                                   │ Detalhe         │
│ recolhíveis  │           MAPA                    │ sob demanda     │
│              │                                   │ evidências      │
│ legenda      │ mini-mapa · zoom · ajustar · foco  │ oportunidades   │
├──────────────┴───────────────────────────────────┴─────────────────┤
│ Linha do tempo / avisos / resultado parcial, em painel recolhível   │
└────────────────────────────────────────────────────────────────────┘
```

O canvas ocupa o espaço restante da viewport. Painéis podem recolher e sobrepor em telas menores. Tela inteira do navegador é uma opção adicional; não é necessária para explorar.

A visão inicial de triagem SRE/ERT prioriza serviços e dependências, com infraestrutura recolhida. O botão **Entenda o mapa** e a ação **O que é este componente?** abrem ajuda local por tipo, relações e estados. Vocabulário, catálogo e critérios de legibilidade estão em [Mapa e ajuda para SRE/ERT](08-mapa-sre-ert-ajuda.md).

Camadas: entrada/frontend → serviços → execução/infraestrutura → dependências externas. Agrupar réplicas por serviço/workload; bancos e externos têm representação distinta. Arestas mostram direção e tipo (`CALLS`, `RUNS_ON`, `BELONGS_TO`, `OBSERVED_ON`), sem converter todo relacionamento em chamada de rede. Um banco identificado somente por endpoint aparece como dependência lógica, sem inventar host.

A posição de nós existentes é preservada durante atualizações. “Reorganizar mapa” executa layout explicitamente. Alto volume usa agrupamento, resumo e expansão por vizinhança. O MVP propõe carregar no máximo 500 nós/1.000 arestas por resultado e iniciar com até 200 nós visíveis agrupados; os números são metas de projeto a calibrar. Custos de layout, rótulos e arestas variam por grafo e dispositivo. [Cytoscape.js — performance](https://js.cytoscape.org/#performance).

## 4. Filtros e ações

| Interação | Busca remota? | Efeito |
| --- | --- | --- |
| Filtrar tipo, tag, tecnologia, evidência, novidade ou severidade | Não | Filtra o snapshot carregado ou consulta somente o PostgreSQL. |
| Buscar nome/ID no mapa, selecionar nó, ajustar zoom | Não | Navegação local. |
| Alternar hipótese ou relação do frontend inteiro | Não | Muda representação, com legenda e aviso de abrangência. |
| Abrir evidência persistida | Não | Consulta autorizada no serviço. |
| Alterar período, ambiente ou raiz | Sim, após “Buscar” | Nova sessão, novo plano e orçamento. |
| Expandir dependência já persistida | Não | Revela vizinhança conhecida. |
| Expandir além da cobertura conhecida | Sim, após confirmação do escopo | Nova sessão derivada com limites; não expansão recursiva invisível. |
| Pedir enriquecimento adicional | Sim, após ação explícita | Nova execução governada em sessão derivada; informa motivo e limite. |
| Reabrir histórico ou reconectar eventos | Não | Recupera estado e snapshot. |

Filtros salvos pertencem à sessão/usuário e não alteram o conhecimento compartilhado. Mostrar “38 de 142 componentes” para distinguir filtro de perda de dados. Remover um filtro nunca chama o Dynatrace.

## 5. Estados apresentados

| Situação | Texto e ação principal |
| --- | --- |
| Fila | “Aguardando capacidade do ambiente; limite de espera: …”. Cancelar disponível. |
| Dados válidos | “Mapa recuperado. Atualização dispensada pela política até …”. |
| Resolução | “Associando URL a uma aplicação com evidências disponíveis”. |
| Seleção | “Encontramos mais de uma aplicação; selecione a correta”. Expiração visível. |
| Topologia | “Buscando dependências: 24 componentes conhecidos, nível 1 de 2”. |
| Enriquecimento | “Verificando 2 lacunas com MCP; 1 de 2 chamadas permitidas”. |
| Progresso ausente | “Sem resposta desta etapa há 15 s; prazo restante …”. Sem inventar avanço. |
| Parcial | “Mapa disponível; enriquecimento indisponível” ou “Limite de componentes atingido”. |
| Cancelamento | “Cancelamento solicitado. O mapa obtido será preservado”. |
| Falha sem mapa | Motivo, último estado, etapas tentadas e opção de nova busca. |

“Completo” significa completo em relação ao plano e ao período, nunca inventário absoluto da empresa. O resumo distingue etapas executadas, reutilizadas, não suportadas e interrompidas.

## 6. Proveniência, cobertura e comparação

O detalhe do componente apresenta ID do fornecedor, fonte, janela observada, horário da coleta, escopo (`ROUTE`, `FRONTEND`, `SERVICE`), método de associação, evidência e link seguro para o Dynatrace quando possível. Indicar amostragem, truncamento e máscara de dados.

Selos: **observado**, **associado por configuração**, **confirmado por pessoa**, **hipótese**, **não observado na atualização**. Confirmação humana registra autor, data e justificativa; não transforma hipótese em telemetria observada.

Comparar duas sessões usa snapshots fixos. Nós ausentes na janela nova são “não observados novamente”; remoção exige evidência específica ou regra de expiração. Os diffs de topologia, métricas e oportunidades são separados para não tratar mudança de saúde como mudança estrutural.

## 7. Acessibilidade e recuperação

Fornecer lista/tabela equivalente ao grafo, navegação por teclado, foco visível, rótulos legíveis, preferência por movimento reduzido e indicação além de cor. Mudanças de etapa usam região de status; não retiram o foco do usuário. [WCAG 2.2 — status messages](https://www.w3.org/TR/WCAG22/#status-messages).

REST fornece o estado atual. SSE oferece baixa latência e reconexão; `Last-Event-ID` ajuda o replay, mas entrega durável e deduplicação pertencem à aplicação. Uma lacuna no histórico de eventos força ressincronização do snapshot, sem nova coleta. [WHATWG — Server-sent events](https://html.spec.whatwg.org/dev/server-sent-events.html).
