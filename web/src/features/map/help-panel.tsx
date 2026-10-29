"use client";

import { useId, useState, type ReactElement } from "react";
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Badge,
  Button,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerHeaderTitle,
  Field,
  Input,
  OverlayDrawer,
  Tab,
  TabList,
  Text,
  makeStyles,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import {
  ArrowRightRegular,
  ArrowRoutingRegular,
  CheckmarkCircleRegular,
  CloudRegular,
  CodeRegular,
  CubeRegular,
  DatabaseRegular,
  DesktopRegular,
  DismissRegular,
  GlobeRegular,
  HistoryRegular,
  InfoRegular,
  QuestionCircleRegular,
  SearchRegular,
  WarningRegular,
} from "@fluentui/react-icons";
import { kindLabels, type ComponentKind } from "./model";

interface HelpPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialKind?: ComponentKind;
}

interface ComponentGuide {
  kind: ComponentKind;
  icon: ReactElement;
  description: string;
  example: string;
  relationships: string;
  investigate: string;
  limitation: string;
}

const componentGuides: ComponentGuide[] = [
  {
    kind: "ENTRY",
    icon: <ArrowRoutingRegular />,
    description: "É o endereço ou a rota que inicia sua investigação. Dá contexto ao mapa da aplicação.",
    example: "portoseguro.com.br/aplicacao-a",
    relationships: "Pode estar associado a um frontend por configuração ou por evidência de navegação.",
    investigate: "Confira a rota, o ambiente e a aplicação associados antes de analisar as dependências.",
    limitation: "É um contexto de pesquisa. Não representa, por si só, uma entidade monitorada ou uma chamada observada.",
  },
  {
    kind: "FRONTEND",
    icon: <GlobeRegular />,
    description: "É a aplicação instrumentada no navegador. Pode reunir diferentes páginas e jornadas em um mesmo domínio.",
    example: "Portal digital · React / Next.js",
    relationships: "As setas mostram serviços chamados pelo frontend no período observado.",
    investigate: "Veja a abrangência da evidência: frontend inteiro ou a rota específica da sua busca.",
    limitation: "Uma dependência do frontend inteiro não comprova que a rota pesquisada chamou aquele serviço.",
  },
  {
    kind: "SERVICE",
    icon: <CodeRegular />,
    description: "É um componente lógico que recebe ou processa requisições. Agrupa o comportamento observado de um serviço.",
    example: "Cotação auto · Java / Spring Boot",
    relationships: "Pode chamar outros serviços, consultar dados e estar associado a recursos de execução.",
    investigate: "Compare latência, falhas e volume no mesmo período. Consulte o problema e sua evidência antes de atribuir uma causa.",
    limitation: "Um serviço lógico pode reunir muitas instâncias. Um único nó de serviço não significa uma única réplica.",
  },
  {
    kind: "DATABASE",
    icon: <DatabaseRegular />,
    description: "É uma dependência de dados identificada pela telemetria, normalmente representada pelo serviço ou endpoint acessado.",
    example: "Base de cotações · PostgreSQL 18",
    relationships: "Uma seta de chamada representa acesso ao destino de dados, conforme a evidência disponível.",
    investigate: "Confira duração, falhas e serviços chamadores; a infraestrutura do banco pode exigir investigação adicional.",
    limitation: "Um endpoint lógico não descreve, sozinho, servidores físicos, primário, réplicas ou a configuração de alta disponibilidade.",
  },
  {
    kind: "EXTERNAL",
    icon: <CloudRegular />,
    description: "É um destino de chamada fora do contexto monitorado ou com visibilidade limitada nesta coleta.",
    example: "Antifraude · API de parceiro",
    relationships: "A relação indica o destino conhecido da chamada. Pode não haver métricas do próprio destino.",
    investigate: "Verifique o comportamento da chamada no serviço de origem e a cobertura de monitoramento disponível.",
    limitation: "Externo ou não monitorado não significa indisponível. Sem dados é um estado diferente de falha.",
  },
  {
    kind: "WORKLOAD",
    icon: <CubeRegular />,
    description: "É um controlador ou agrupamento de execução Kubernetes, como um Deployment ou StatefulSet.",
    example: "cotacao-auto · Deployment com 3 pods prontos",
    relationships: "Relaciona o serviço à execução conhecida. Pods são unidades de agendamento e podem conter vários containers.",
    investigate: "Diferencie réplicas desejadas, existentes e prontas. Confira onde estão distribuídas e a idade da observação.",
    limitation: "Três pods não comprovam três domínios de falha. A quantidade de réplicas, sozinha, não demonstra resiliência.",
  },
  {
    kind: "HOST",
    icon: <DesktopRegular />,
    description: "É um recurso computacional de execução, como uma máquina física, uma VM ou um nó Kubernetes identificado.",
    example: "worker-pool-a · nó Kubernetes",
    relationships: "Linhas de execução ou pertencimento mostram onde componentes foram observados; não representam requests.",
    investigate: "Confira cobertura, recursos, domínio de falha e associação com a execução do serviço.",
    limitation: "Um único host em uma coleta parcial não confirma ponto único de falha. Failover e recursos não observados podem existir.",
  },
  {
    kind: "MESSAGING",
    icon: <ArrowRoutingRegular />,
    description: "É uma dependência assíncrona, como uma fila, um tópico ou um broker identificado na evidência.",
    example: "Eventos de proposta · tópico Kafka",
    relationships: "Publicar e consumir são ações diferentes. O rótulo da relação esclarece a operação conhecida.",
    investigate: "Consulte o produtor, o consumidor e a janela da evidência; um caminho assíncrono pode ter tempos e estados próprios.",
    limitation: "Não interprete a linha como uma chamada HTTP síncrona nem deduza entrega ou consumo sem evidência específica.",
  },
];

const useStyles = makeStyles({
  drawer: {
    maxWidth: "100vw",
  },
  header: {
    paddingTop: tokens.spacingVerticalXL,
    paddingBottom: tokens.spacingVerticalM,
  },
  subtitle: {
    display: "block",
    marginTop: tokens.spacingVerticalXS,
    color: tokens.colorNeutralForeground3,
  },
  body: {
    paddingBottom: tokens.spacingVerticalXL,
  },
  tabs: {
    borderBottomWidth: tokens.strokeWidthThin,
    borderBottomStyle: "solid",
    borderBottomColor: tokens.colorNeutralStroke2,
    marginBottom: tokens.spacingVerticalL,
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
  },
  intro: {
    margin: 0,
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase400,
  },
  context: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  accordion: {
    borderTopWidth: tokens.strokeWidthThin,
    borderTopStyle: "solid",
    borderTopColor: tokens.colorNeutralStroke2,
  },
  accordionItem: {
    borderBottomWidth: tokens.strokeWidthThin,
    borderBottomStyle: "solid",
    borderBottomColor: tokens.colorNeutralStroke2,
  },
  accordionHeader: {
    minHeight: "52px",
  },
  accordionPanel: {
    marginLeft: 0,
    marginRight: 0,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalL,
  },
  guide: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  paragraph: {
    margin: 0,
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase400,
  },
  example: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  label: {
    display: "block",
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalXXS,
  },
  limitation: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalS,
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    borderLeftWidth: tokens.strokeWidthThick,
    borderLeftStyle: "solid",
    borderLeftColor: tokens.colorBrandStroke1,
  },
  infoIcon: {
    flexShrink: 0,
    color: tokens.colorBrandForeground1,
    fontSize: "20px",
    marginTop: tokens.spacingVerticalXXS,
  },
  card: {
    ...shorthands.border(tokens.strokeWidthThin, "solid", tokens.colorNeutralStroke2),
    borderRadius: tokens.borderRadiusLarge,
    padding: tokens.spacingHorizontalL,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  relation: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalS,
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  relationArrow: {
    color: tokens.colorBrandForeground1,
    fontSize: "20px",
  },
  stateRow: {
    display: "grid",
    gridTemplateColumns: "24px 1fr",
    alignItems: "start",
    gap: tokens.spacingHorizontalM,
  },
  stateIcon: {
    fontSize: "20px",
    color: tokens.colorNeutralForeground2,
  },
  footer: {
    borderTopWidth: tokens.strokeWidthThin,
    borderTopStyle: "solid",
    borderTopColor: tokens.colorNeutralStroke2,
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground3,
    gap: tokens.spacingHorizontalS,
  },
  empty: {
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingHorizontalL,
    borderRadius: tokens.borderRadiusMedium,
  },
});

function GuideContent({ initialKind }: { initialKind?: ComponentKind }) {
  const styles = useStyles();
  const id = useId();
  const [tab, setTab] = useState("types");
  const [query, setQuery] = useState("");
  const [openItems, setOpenItems] = useState<string[]>([initialKind ?? "SERVICE"]);
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const filteredGuides = componentGuides.filter((guide) =>
    `${kindLabels[guide.kind]} ${guide.description} ${guide.example}`
      .toLocaleLowerCase("pt-BR")
      .includes(normalizedQuery),
  );
  const orderedGuides = initialKind
    ? [...filteredGuides].sort((a, b) => Number(b.kind === initialKind) - Number(a.kind === initialKind))
    : filteredGuides;

  return (
    <>
      <TabList
        className={styles.tabs}
        selectedValue={tab}
        onTabSelect={(_, data) => setTab(String(data.value))}
        aria-label="Guia de leitura do mapa"
      >
        <Tab id={`${id}-types-tab`} aria-controls={`${id}-types-panel`} value="types">Tipos</Tab>
        <Tab id={`${id}-relations-tab`} aria-controls={`${id}-relations-panel`} value="relations">Conexões</Tab>
        <Tab id={`${id}-states-tab`} aria-controls={`${id}-states-panel`} value="states">Estados</Tab>
      </TabList>

      {tab === "types" && (
        <section
          id={`${id}-types-panel`}
          role="tabpanel"
          aria-labelledby={`${id}-types-tab`}
          className={styles.content}
        >
          <p className={styles.intro}>Entenda o que cada componente representa e o que a evidência permite concluir.</p>
          {initialKind && (
            <div className={styles.context}>
              <Text size={200}>Ajuda para o componente selecionado</Text>
              <Badge appearance="tint" color="brand">{kindLabels[initialKind]}</Badge>
            </div>
          )}
          <Field label="Buscar tipo de componente">
            <Input
              value={query}
              onChange={(_, data) => setQuery(data.value)}
              contentBefore={<SearchRegular />}
              placeholder="Ex.: serviço, banco, Kubernetes"
            />
          </Field>
          <Accordion
            className={styles.accordion}
            collapsible
            multiple
            openItems={openItems}
            onToggle={(_, data) => setOpenItems(data.openItems.map(String))}
          >
            {orderedGuides.map((guide) => (
              <AccordionItem key={guide.kind} value={guide.kind} className={styles.accordionItem}>
                <AccordionHeader className={styles.accordionHeader} icon={guide.icon}>
                  {kindLabels[guide.kind]}
                </AccordionHeader>
                <AccordionPanel className={styles.accordionPanel}>
                  <div className={styles.guide}>
                    <p className={styles.paragraph}>{guide.description}</p>
                    <div className={styles.example}>
                      <Text size={200} weight="semibold">Exemplo no mapa</Text>
                      <Text>{guide.example}</Text>
                    </div>
                    <p className={styles.paragraph}>
                      <span className={styles.label}>Como se relaciona</span>
                      {guide.relationships}
                    </p>
                    <p className={styles.paragraph}>
                      <span className={styles.label}>O que verificar</span>
                      {guide.investigate}
                    </p>
                    <div className={styles.limitation}>
                      <InfoRegular className={styles.infoIcon} aria-hidden="true" />
                      <p className={styles.paragraph}>
                        <span className={styles.label}>Limite da interpretação</span>
                        {guide.limitation}
                      </p>
                    </div>
                  </div>
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
          {filteredGuides.length === 0 && (
            <div className={styles.empty} role="status">
              <Text weight="semibold">Nenhum tipo encontrado</Text>
              <p className={styles.paragraph}>Tente outro nome ou limpe a busca para ver o catálogo completo.</p>
            </div>
          )}
        </section>
      )}

      {tab === "relations" && (
        <section
          id={`${id}-relations-panel`}
          role="tabpanel"
          aria-labelledby={`${id}-relations-tab`}
          className={styles.content}
        >
          <p className={styles.intro}>Comece pela direção e pelo tipo da conexão. Uma dependência observada não demonstra a causa de um incidente.</p>
          <article className={styles.card}>
            <Text weight="semibold">Chamada</Text>
            <div className={styles.relation}>
              <span>Chamador</span><ArrowRightRegular className={styles.relationArrow} aria-hidden="true" /><span>Chamado</span>
            </div>
            <p className={styles.paragraph}>A seta parte de quem faz a chamada e aponta para o destino. O rótulo pode indicar uma operação específica, como publicar em um tópico.</p>
          </article>
          <article className={styles.card}>
            <Text weight="semibold">Execução e pertencimento</Text>
            <p className={styles.paragraph}>Linhas de infraestrutura mostram relações como “executa em” e “pertence a”. Elas não são requests de rede e usam um estilo distinto das chamadas.</p>
          </article>
          <article className={styles.card}>
            <Text weight="semibold">Associação e hipótese</Text>
            <p className={styles.paragraph}>Uma associação configurada identifica contexto. Uma hipótese sinaliza algo a investigar. Nenhuma delas deve ser lida como chamada técnica confirmada sem evidência.</p>
          </article>
          <div className={styles.limitation}>
            <InfoRegular className={styles.infoIcon} aria-hidden="true" />
            <p className={styles.paragraph}>
              <span className={styles.label}>Frontend não é o mesmo que rota</span>
              Um frontend pode atender várias jornadas. Consulte o escopo da evidência antes de atribuir uma dependência à URL pesquisada.
            </p>
          </div>
          <p className={styles.paragraph}>Uma dependência degradada pode estar correlacionada ao incidente. A causa raiz exige análise adicional; quando atribuída pelo Dynatrace, essa origem deve estar identificada.</p>
        </section>
      )}

      {tab === "states" && (
        <section
          id={`${id}-states-panel`}
          role="tabpanel"
          aria-labelledby={`${id}-states-tab`}
          className={styles.content}
        >
          <p className={styles.intro}>Saúde, atualidade e cobertura são informações diferentes. Leia o estado junto com o período e a evidência.</p>
          {[
            { name: "Problema ativo", icon: <WarningRegular />, description: "Problema identificado no período observado. Em uma sessão histórica, não significa que continua ativo agora." },
            { name: "Atenção", icon: <WarningRegular />, description: "Sinal de degradação ou violação de regra configurada. Abra o detalhe para entender o indicador e seu comparador." },
            { name: "Sem violação", icon: <CheckmarkCircleRegular />, description: "Nenhuma violação foi observada nas regras avaliadas. Não é garantia de saúde total ou ausência de incidentes." },
            { name: "Sem dados", icon: <QuestionCircleRegular />, description: "A evidência não permite avaliar. Pode faltar instrumentação, visibilidade ou tráfego. Não equivale a saudável nem a indisponível." },
            { name: "Desatualizado", icon: <HistoryRegular />, description: "Existe uma observação, mas sua idade excede a validade definida. A data da coleta não substitui a data do evento observado." },
            { name: "Parcial", icon: <InfoRegular />, description: "A busca não cobriu tudo o que foi planejado, por limite ou indisponibilidade. Componentes não observados não foram necessariamente removidos." },
            { name: "Hipótese", icon: <QuestionCircleRegular />, description: "Sugestão ainda não confirmada. Não deve ser interpretada como relação factual, causa ou ponto único de falha comprovado." },
          ].map((state) => (
            <article key={state.name} className={styles.stateRow}>
              <span className={styles.stateIcon} aria-hidden="true">{state.icon}</span>
              <div>
                <Text weight="semibold">{state.name}</Text>
                <p className={styles.paragraph}>{state.description}</p>
              </div>
            </article>
          ))}
          <div className={styles.limitation}>
            <InfoRegular className={styles.infoIcon} aria-hidden="true" />
            <p className={styles.paragraph}>
              <span className={styles.label}>Inventário parcial não confirma SPOF</span>
              Um host ou uma instância observados não demonstram ausência de redundância. Verifique cobertura, domínios de falha e o desenho de failover.
            </p>
          </div>
          <p className={styles.paragraph}>Amostragem e limites podem reduzir a cobertura. Valores sem comparador válido são observações; não são automaticamente regressões de desempenho.</p>
        </section>
      )}
    </>
  );
}

export function HelpPanel({ open, onOpenChange, initialKind }: HelpPanelProps) {
  const styles = useStyles();
  const titleId = useId();

  return (
    <OverlayDrawer
      open={open}
      onOpenChange={(_, data) => onOpenChange(data.open)}
      position="end"
      size="medium"
      className={styles.drawer}
      aria-labelledby={titleId}
    >
      <DrawerHeader className={styles.header}>
        <DrawerHeaderTitle
          id={titleId}
          action={
            <Button
              appearance="subtle"
              icon={<DismissRegular />}
              aria-label="Fechar ajuda do mapa"
              onClick={() => onOpenChange(false)}
            />
          }
        >
          Entenda o mapa
        </DrawerHeaderTitle>
        <Text className={styles.subtitle}>Guia de leitura para SRE e ERT</Text>
      </DrawerHeader>
      <DrawerBody className={styles.body}>
        {open && <GuideContent key={initialKind ?? "catalog"} initialKind={initialKind} />}
      </DrawerBody>
      <DrawerFooter className={styles.footer}>
        <InfoRegular aria-hidden="true" />
        <Text size={200}>Esta ajuda não executa novas buscas.</Text>
      </DrawerFooter>
    </OverlayDrawer>
  );
}
