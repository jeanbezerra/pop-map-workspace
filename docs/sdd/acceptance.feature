# language: pt
Funcionalidade: Descoberta governada e exploração legível de aplicações
  Como integrante de SRE ou ERT
  Quero explorar componentes e evidências de desempenho e resiliência
  Para investigar a aplicação sem consultas ilimitadas nem conclusões sem evidência

  Cenário: Buscar aplicação ainda não conhecida
    Dado um ambiente autorizado sem snapshot compatível para a URL
    Quando uma busca válida é aceita
    Então uma sessão é criada
    E a resolução remota só começa depois do plano inicial e da reserva
    E a execução possui prazo absoluto e limites ativos persistidos

  Cenário: Reutilizar conhecimento ainda válido
    Dado um snapshot autorizado que satisfaz o pedido e sua tolerância de idade
    Quando a busca usa atualização IF_NEEDED
    Então uma nova sessão referencia o snapshot
    E o motivo FRESH_CACHE informa a idade e a cobertura
    E nenhuma execução remota é necessária

  Cenário: Não substituir atualização imediata por cache
    Dado um snapshot autorizado recente
    Quando a busca usa atualização NOW
    Então o snapshot aparece como baseline
    E uma atualização governada é admitida ou sua rejeição é explicada
    E o sistema não declara atualização realizada sem executá-la

  Cenário: Coalescer buscas elegíveis concorrentes
    Dado duas buscas com a mesma raiz confirmada, autorização, intervalo e plano
    Quando as buscas são aceitas simultaneamente
    Então existem duas sessões e no máximo uma execução remota compartilhável
    E o consumo real da execução é contabilizado uma vez

  Cenário: Preservar decisões independentes em ambiguidades
    Dado duas sessões com URL ambígua e raízes ainda não confirmadas
    Quando cada pessoa seleciona um candidato diferente
    Então as execuções privadas mantêm as escolhas independentes
    E nenhuma sessão depende da seleção da outra

  Cenário: Repetir requisição idempotente
    Dado uma busca aceita com uma chave de idempotência
    Quando a mesma pessoa reenvia a mesma chave e conteúdo
    Então a mesma sessão é devolvida sem novo consumo
    Mas conteúdo diferente com a mesma chave gera conflito

  Cenário: Filtrar e abrir ajuda sem custo remoto
    Dado um mapa persistido
    Quando a pessoa aplica vinte filtros, altera zoom e abre a ajuda de tipos
    Então não há novas chamadas Dynatrace API ou MCP
    E a quantidade de componentes ocultos permanece visível

  Cenário: Recuperar conexão de progresso
    Dado uma execução em andamento com eventos persistidos
    Quando a conexão SSE cai e é retomada
    Então o cliente recupera eventos ou ressincroniza o snapshot
    E não cria outra sessão nem repete consultas remotas

  Cenário: Expirar uma execução sem trabalho infinito
    Dado um limite de fila, entrada, trabalho ativo ou prazo absoluto esgotado
    Quando o watchdog avalia a execução
    Então o motivo identifica qual limite expirou
    E a execução termina com snapshot parcial útil ou timeout sem resultado útil
    E nenhuma nova chamada é despachada

  Cenário: Rejeitar orçamento antes do despacho
    Dado uma quota definitivamente insuficiente
    Quando uma operação tenta reservar seu limite superior
    Então a chamada não é enviada
    E o run termina parcial ou com falha explicável sem esperar o timeout de fila

  Cenário: Não repetir outcome pago desconhecido
    Dado uma ferramenta possivelmente aceita pelo fornecedor
    Quando a conexão termina antes de conhecer o resultado
    Então a operação fica com outcome UNKNOWN
    E conserva risco de consumo e ocupação remota para reconciliação
    E não é reenviada automaticamente

  Cenário: Cancelar um assinante de execução compartilhada
    Dado duas sessões associadas ao mesmo run e um snapshot na versão N
    Quando uma sessão é cancelada e seu cancelamento é confirmado
    Então ela conserva atomicamente a versão N
    E a outra sessão pode receber a versão N mais 1
    E a sessão cancelada não muda ao ser reaberta

  Cenário: Finalizar cancelamento sem confirmação remota
    Dado um run em CANCELLING sem outros assinantes
    Quando o prazo local de graça se esgota
    Então o run termina CANCELLED com remoteOutcome desconhecido
    E não afirma interrupção remota nem consumo zero

  Cenário: Preservar topologia na falha MCP
    Dado topologia válida já persistida e enriquecimento habilitado no plano
    Quando o MCP falha ou muda o schema da ferramenta
    Então o mapa permanece disponível
    E o resultado é parcial com motivo específico
    E não há loop de reconexão sem limite

  Cenário: Impedir publicação de worker antigo
    Dado um worker cujo lease e fencing token expiraram
    Quando sua resposta remota chega depois da recuperação ou finalização
    Então ele não altera estado nem snapshot publicado
    E a auditoria e o ledger podem registrar o outcome tardio

  Cenário: Isolar autorização no cache e no cliente MCP
    Dado snapshots e clientes de dois scopes não equivalentes
    Quando uma pessoa busca a mesma URL
    Então somente recursos do scope autorizado são acessíveis
    E token, histórico, evidências e replay não cruzam a fronteira

  Cenário: Não atribuir relação ampla à rota
    Dado uma relação observada entre frontend e serviço sem contexto da rota
    Quando a pessoa busca um path desse frontend
    Então a aresta informa escopo FRONTEND e atribuição à rota não comprovada
    E não é apresentada como chamada específica daquele path

  Cenário: Preservar semântica de métricas
    Dado contagens de falhas e requests de grupos compatíveis
    Quando a taxa é calculada
    Então o sistema divide soma de falhas por soma de requests
    E total zero não vira taxa saudável
    E percentis de grupos não são combinados por média simples

  Cenário: Não fabricar regressão sem comparador
    Dado latência observada sem SLO ou baseline comparável
    Quando as regras de desempenho são avaliadas
    Então a métrica é exibida como observação
    E a regra informa baseline insuficiente sem declarar regressão

  Cenário: Não inferir SPOF de inventário parcial
    Dado um serviço relacionado a um único host em coleta parcial
    Quando a resiliência é analisada
    Então a conclusão é hipótese de revisão com limitações
    E não é declarada ausência de redundância ou SPOF confirmado

  Cenário: Usar mapa e ajuda em triagem acessível
    Dado a visão inicial por serviços
    Quando uma pessoa navega por teclado e abre O que é este componente
    Então o painel mostra tipo, exemplo, relações e limites de interpretação
    E uma tabela equivalente permite a mesma investigação
    E novos lotes não mudam foco, zoom ou posição dos nós existentes

  Cenário: Distinguir saúde desconhecida e dados antigos
    Dado um grupo com componentes degradados, sem dados e desatualizados
    Quando o grupo está recolhido
    Então ele apresenta os contadores e selos correspondentes
    E não é marcado saudável somente por ausência de violação conhecida

  Cenário: Não prometer cobertura da nova cauda temporal
    Dado um snapshot estrutural recente e métricas de um período anterior
    Quando uma busca solicita um novo período
    Então a topologia pode aparecer com sua idade e tolerância declaradas
    E métricas ou evidências de rota só são reutilizadas se a cobertura for compatível
    E o sistema não afirma observar uma janela ainda não consultada
