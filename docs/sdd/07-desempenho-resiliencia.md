# Perfil prioritário: desempenho e resiliência

Prioridade confirmada pelo usuário em 28/10/2026. O ambiente alvo é Dynatrace SaaS com Grail e MCP disponíveis. A descoberta deve responder “quais componentes estão associados a esta aplicação e onde há sinais de degradação ou riscos a investigar?”.

## 1. Camadas de análise

1. **Topologia e atribuição:** estabelecer componentes, direção de chamadas e abrangência rota/frontend.
2. **RED:** obter taxa de requests, erros/falhas e duração em métricas agregadas para os IDs conhecidos.
3. **Problemas existentes:** correlacionar problemas Dynatrace com as entidades do mapa e seu período.
4. **Regras explicáveis:** comparar com SLO/baseline válido, sem investigação irrestrita.
5. **MCP:** explicar/priorizar evidências ou preencher uma lacuna limitada, conforme política. Não inventar medições ou causa.

No perfil padrão, `FETCH_HEALTH` e busca de problemas no escopo são coberturas prometidas. Ausência de permissão/dados gera indicação de cobertura incompleta, preservando topologia. Traces exemplares, análise estrutural de HA e IA são condicionais, com motivo quando não executados.

Métricas agregadas são a primeira fonte para RED. Spans ficam restritos a exemplares ou investigação focalizada, porque captura e leitura podem ser amostradas e contagem bruta não representa necessariamente todo o tráfego. [Distributed tracing analytics](https://docs.dynatrace.com/docs/observe/application-observability/distributed-tracing/advanced-tracing-analytics).

## 2. Regras do MVP

| Regra | Evidências necessárias | Mensagem e limite |
| --- | --- | --- |
| `LATENCY_REGRESSION` | p95 ou indicador compatível, volume, mesma população e SLO/baseline comparável | “Latência acima do objetivo” ou “regressão observada”; sem comparador válido, somente valor observado |
| `FAILURE_RATE_REGRESSION` | Falhas e total no mesmo escopo/período, política de volume e comparador | Taxa calculada por contagens; sem total ou comparador, inconclusivo |
| `DEGRADED_DEPENDENCY` | Relação `calls`, RED do destino e sobreposição temporal; vínculo de rota quando afirmado | “Dependência degradada correlacionada”; não declarar causalidade automaticamente |
| `ACTIVE_DYNATRACE_PROBLEM` | Problema, IDs afetados, status, categoria, período e estado de análise | Mostrar problema e eventual causa como atribuídos pelo Dynatrace, com link e data |

Regras condicionais:

| Regra | Evidências necessárias | Mensagem e limite |
| --- | --- | --- |
| `TRAFFIC_DROP_WITH_FAILURE_SIGNAL` | Queda versus tráfego esperado e sinal independente, como falhas ou problema de disponibilidade | Queda isolada é observação; não equivale a indisponibilidade |
| `RESILIENCE_CONCENTRATION` | Relação serviço/workload, instâncias prontas, domínios de falha e cobertura de infraestrutura conhecida | “Concentração de resiliência a verificar”; ausência de réplica observada não prova SPOF |

A análise de latência deve preservar população e agregação; não calcular média de percentis por host ou intervalo. Comparação de p95 requer fonte compatível ou distribuição que permita agregação correta. [Response time analysis](https://docs.dynatrace.com/docs/observe/application-observability/services/services-app/response-time-analysis).

SLO de proporção de requests abaixo de um tempo não é convertido automaticamente em limiar p95; mapear somente indicadores e agregações compatíveis.

Taxa de falhas é `soma(falhas) / soma(requests)` para grupos compatíveis, não média simples de percentuais. Usar classificação de failure detection da fonte. HTTP 4xx ou exceção isolada não são automaticamente requests falhados; total zero é desconhecido/sem tráfego. [Service concepts](https://docs.dynatrace.com/docs/observe/application-observability/services/services-concepts), [Errors versus failures](https://docs.dynatrace.com/docs/observe/application-observability-classic/services-classic/services-concepts-classic).

Para problemas, homologar a view de estado atual e o lookback necessário: uma janela genérica de uma hora não garante recuperar todo problema ainda aberto. Persistir ID, entidades, estado e `dt.analysis.ready`, quando disponível. Deduplicar pelo ID estável; snapshots diferentes do mesmo problema não são incidentes distintos. Diferenciar mudança no problema de mudança na topologia. [Davis semantic model](https://docs.dynatrace.com/docs/semantic-dictionary/model/davis).

Um nó `SERVICE` não é uma réplica, e a relação com um único host observado não demonstra ausência de redundância. Confirmar SPOF exige desenho de HA/failover e evidência além desse inventário. [Service/workload concepts](https://docs.dynatrace.com/docs/observe/application-observability/services/services-concepts), [Smartscape relationships](https://docs.dynatrace.com/docs/semantic-dictionary/model/smartscape/core).

## 3. Baselines e severidade

Preferir SLOs já configurados e indicadores do próprio Dynatrace. Regras novas não criam detectores, alarmes ou mudanças no ambiente.

Cada configuração de regra informa comparador, limiar, duração mínima, volume mínimo, agregação e política de sampling. Não há um limiar universal de “p95 ruim” para todas as aplicações. Sem regra calibrada, a tela mostra métricas e problemas existentes; a oportunidade recebe `INSUFFICIENT_BASELINE` ou `INSUFFICIENT_SAMPLES` em vez de alerta fabricado.

Baseline registra janela, duração, resolução, população/endpoint, fonte, volume, sampling e justificativa de comparabilidade. Uma janela anterior pode ser apresentada como comparação descritiva, mas só é baseline de regressão se a política atestar comparabilidade. Sazonalidade e mudança de tráfego devem ser visíveis. Nenhum número fixo de amostras garante sozinho precisão estatística.

Achado registra `observedValue`, `baselineValue`, `unit`, `aggregation`, `sampleCount` quando disponível, `minimumSamplePolicy`, `window`, `subjectIds`, `evidenceIds`, `ruleVersion`, `limitations` e `suggestedAction`. Escopo de serviço não é apresentado como experiência da rota sem evidência adicional.

Severidade usa SLO/impacto evidenciado ou severidade do problema de origem; IA não promove severidade por linguagem persuasiva. Agrupar cartões por assunto/problema e evitar múltiplas descrições do mesmo incidente.

## 4. Apresentação no mapa

Colorir nós por estado conhecido, com símbolo/rótulo alternativo e estado “desconhecido”. Aresta destacada indica relação correlacionada; a legenda não a chama de causa. Selecionar achado realça o subgrafo e abre: observação, comparação, evidência, abrangência, limitações e próximo passo.

Exemplo de conteúdo, sem medição real:

> Serviço de cotação com latência acima do SLO configurado no período selecionado. A relação com o frontend foi observada; o vínculo específico com `/aplicacao-a` ainda não foi comprovado. Ver evidência e abrir análise no Dynatrace.

Outro exemplo:

> Apenas um domínio de falha foi observado nesta coleta parcial. Revisar redundância; os dados disponíveis não confirmam ponto único de falha.

## 5. Plano de custo para esse perfil

Dentro das seis execuções de query propostas, o planejador prioriza resolução e topologia, depois RED/baseline agregado e problemas existentes. Combinar agregações compatíveis quando os schemas permitirem; reservar restante para uma investigação focalizada. Não prometer traces, baseline extenso e todas as regras se não couberem no orçamento. Cada etapa dispensada por limite é mostrada na cobertura.

Fontes e nomes reais de métricas serão descobertos e homologados; não fixar no código chaves clássicas para serviços novos ou o contrário. O MCP recebe resumo estruturado pequeno, não varredura bruta de logs. Gerar explicação é opcional: o achado determinístico já deve ser útil sem ela.
