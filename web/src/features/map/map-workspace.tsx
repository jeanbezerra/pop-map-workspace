"use client";

import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Avatar, Badge, Button, Dialog, DialogActions, DialogBody, DialogContent,
  DialogSurface, DialogTitle, Field, Input, ProgressBar, Select,
  Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow,
  Tab, TabList, Text, Tooltip, mergeClasses,
} from "@fluentui/react-components";
import {
  AddRegular, ArrowDownloadRegular, ArrowRightRegular, ArrowSyncRegular,
  CheckmarkCircleRegular, ChevronRightRegular, ClockRegular,
  DismissRegular, FilterRegular, GlobeRegular, HistoryRegular, InfoRegular,
  ListRegular, MapRegular, QuestionCircleRegular, SearchRegular,
  ShieldCheckmarkRegular, WarningRegular,
} from "@fluentui/react-icons";
import { ComponentDetails } from "./component-details";
import { AppBrand } from "@/components/app-brand";
import { demoComponents, demoRelations } from "./demo-data";
import { HelpPanel } from "./help-panel";
import { MapFiltersPanel } from "./map-filters-panel";
import { filterMap, kindLabels, statusLabels, type ComponentKind, type MapFilters, type RunState } from "./model";
import { saveDemoSession, useDemoHistory } from "./session-store";
import { TopologyCanvas } from "./topology-canvas";
import { useCompactLayout } from "./use-compact-layout";
import { useWorkspaceStyles } from "./workspace.styles";

const allKinds = Object.keys(kindLabels) as ComponentKind[];
const initialFilters: MapFilters = { query: "", kinds: allKinds, onlyProblems: false, showInfrastructure: false, keepContext: true };
const phases = ["Recuperando mapa conhecido", "Atualizando dependências", "Analisando desempenho", "Consolidando evidências"];

export function MapWorkspace() {
  const styles = useWorkspaceStyles();
  const [view, setView] = useState<"map" | "history">("map");
  const [display, setDisplay] = useState<"graph" | "list">("graph");
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [compactFiltersOpen, setCompactFiltersOpen] = useState(false);
  const compactLayout = useCompactLayout();
  const filtersPanelId = useId();
  const filtersOpen = compactLayout ? compactFiltersOpen : filtersVisible;
  const [filters, setFilters] = useState<MapFilters>(initialFilters);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpKind, setHelpKind] = useState<ComponentKind | undefined>();
  const [searchOpen, setSearchOpen] = useState(false);
  const [url, setUrl] = useState("https://portoseguro.com.br/aplicacao-a");
  const [draftUrl, setDraftUrl] = useState(url);
  const [environment, setEnvironment] = useState("Produção");
  const [draftEnvironment, setDraftEnvironment] = useState(environment);
  const [period, setPeriod] = useState("Última hora");
  const [draftPeriod, setDraftPeriod] = useState(period);
  const [validation, setValidation] = useState("");
  const [runState, setRunState] = useState<RunState>("idle");
  const [step, setStep] = useState(0);
  const [sessionId, setSessionId] = useState("DEMO-001");
  const [notice, setNotice] = useState("");
  const startedAt = useRef(0);
  const history = useDemoHistory();

  const components = useMemo(() => demoComponents.map((component) => component.id === "entry"
    ? { ...component, name: new URL(url).pathname || "/" } : component), [url]);
  const filtered = useMemo(() => filterMap(components, demoRelations, filters), [components, filters]);
  const selected = components.find((component) => component.id === selectedId);
  const contextCount = filtered.components.filter((component) => component.contextOnly).length;
  const problems = components.filter((component) => ["critical", "warning"].includes(component.status)).length;

  useEffect(() => {
    const breakpoint = window.matchMedia("(max-width: 1099px)");
    const closeDrawerOnResize = () => setCompactFiltersOpen(false);
    breakpoint.addEventListener("change", closeDrawerOnResize);
    return () => breakpoint.removeEventListener("change", closeDrawerOnResize);
  }, []);

  useEffect(() => {
    if (runState !== "running") return;
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt.current;
      setStep(Math.min(3, Math.floor(elapsed / 1100)));
      if (elapsed >= 4400) {
        setRunState("completed");
        const saved = saveDemoSession({ id: sessionId, url, createdAt: new Date(startedAt.current).toISOString(), outcome: "completed" });
        setNotice(saved ? "Simulação concluída. Sessão salva neste navegador." : "Simulação concluída. O navegador não permitiu salvar o histórico.");
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [runState, sessionId, url]);

  function startSimulation(nextUrl = url, nextEnvironment = environment, nextPeriod = period) {
    setUrl(nextUrl); setEnvironment(nextEnvironment); setPeriod(nextPeriod);
    setSessionId(`DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`);
    startedAt.current = Date.now();
    setStep(0); setRunState("running"); setView("map"); setSelectedId(null);
    setNotice("Simulação local iniciada. Nenhuma consulta será enviada ao Dynatrace.");
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const parsed = new URL(draftUrl.trim());
      if (!["https:", "http:"].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error("invalid");
      parsed.search = ""; // Query strings podem conter dados pessoais/segredos e não são guardadas na prévia.
      parsed.hash = "";
      setValidation(""); setSearchOpen(false);
      startSimulation(parsed.toString(), draftEnvironment, draftPeriod);
    } catch { setValidation("Informe uma URL http ou https válida, sem credenciais embutidas."); }
  }

  function cancelSimulation() {
    setRunState("cancelled");
    const saved = saveDemoSession({ id: sessionId, url, createdAt: new Date(startedAt.current).toISOString(), outcome: "cancelled" });
    setNotice(saved ? "Simulação cancelada. O mapa conhecido foi preservado." : "Simulação cancelada. Histórico local indisponível.");
  }

  function exportSnapshot() {
    const blob = new Blob([JSON.stringify({ mode: "DEMO", sessionId, url, environment, period, components: filtered.components, relations: filtered.relations }, null, 2)], { type: "application/json" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl; anchor.download = `pop-map-${sessionId.toLowerCase()}.json`; anchor.click();
    URL.revokeObjectURL(objectUrl);
    setNotice("Snapshot de demonstração exportado em JSON.");
  }

  function openHelp(kind?: ComponentKind) { setHelpKind(kind); setHelpOpen(true); }
  function openSearch() { setDraftUrl(url); setDraftEnvironment(environment); setDraftPeriod(period); setValidation(""); setSearchOpen(true); }

  return (
    <div className={styles.app}>
      <a href="#main-content" className={styles.skip}>Ir para o conteúdo</a>
      <header className={styles.header}>
        <AppBrand />
        <div className={styles.headerRight}>
          <Badge className={styles.headerDemo} appearance="tint" color="informative" icon={<InfoRegular />}>Prévia · dados fictícios</Badge>
          <span className={mergeClasses(styles.stripSecondary, styles.headerAudience)}><ShieldCheckmarkRegular aria-hidden /> SRE / ERT</span>
          <Avatar name="Equipe SRE" initials="SR" size={32} color="brand" aria-label="Ambiente de revisão da equipe SRE" />
        </div>
      </header>

      <div className={styles.body}>
        <nav className={styles.rail} aria-label="Navegação principal">
          <Tooltip content="Mapa de aplicações" relationship="label"><Button className={styles.railButton} appearance={view === "map" ? "primary" : "subtle"} icon={<MapRegular />} aria-label="Mapa de aplicações" aria-current={view === "map" ? "page" : undefined} onClick={() => setView("map")} /></Tooltip>
          <Tooltip content="Sessões neste navegador" relationship="label"><Button className={styles.railButton} appearance={view === "history" ? "primary" : "subtle"} icon={<HistoryRegular />} aria-label="Sessões neste navegador" aria-current={view === "history" ? "page" : undefined} onClick={() => setView("history")} /></Tooltip>
          <div className={styles.railSpacer} />
          <Tooltip content="Entenda o mapa" relationship="label"><Button className={styles.railButton} appearance="subtle" icon={<QuestionCircleRegular />} aria-label="Entenda o mapa" onClick={() => openHelp()} /></Tooltip>
        </nav>

        <main id="main-content" className={styles.main}>
          <div className={styles.pageHeading}>
            <div>
              <div className={styles.eyebrow}><span>Workspace SRE</span><ChevronRightRegular aria-hidden /><span>{view === "map" ? "Exploração de aplicações" : "Histórico local"}</span></div>
              <div className={styles.titleRow}><h1 className={styles.title}>{view === "map" ? "Mapa da aplicação" : "Suas sessões"}</h1><Badge appearance="outline" color="brand">{environment}</Badge></div>
              <span className={styles.subtitle}>{view === "map" ? "Entenda as dependências. Investigue com contexto." : "Buscas simuladas salvas apenas neste navegador."}</span>
            </div>
            <div className={styles.actions}>
              <Button appearance="subtle" icon={<QuestionCircleRegular />} onClick={() => openHelp()}>Entenda o mapa</Button>
              <Button appearance="primary" icon={<AddRegular />} onClick={openSearch} disabled={runState === "running"}>Nova busca</Button>
            </div>
          </div>

          {view === "map" ? <>
            <div className={styles.searchStrip}>
              <span className={styles.url}><GlobeRegular aria-hidden /><Text weight="semibold" size={200}>{url.replace(/^https?:\/\//, "")}</Text></span>
              <span className={styles.stripDivider} aria-hidden />
              <span className={styles.stripSecondary}><ClockRegular aria-hidden />{period} · janela simulada</span>
              <span className={styles.stripSecondary}><HistoryRegular aria-hidden />Snapshot de exemplo</span>
              <div className={styles.stripRight}><Badge appearance="tint" color="success" icon={<CheckmarkCircleRegular />}>Mapa conhecido</Badge><Button size="small" appearance="subtle" icon={<ArrowSyncRegular />} onClick={() => startSimulation()} disabled={runState === "running"}>Simular atualização</Button></div>
            </div>

            <div className={styles.workspace}>
              <MapFiltersPanel id={filtersPanelId} presentation={compactLayout ? "drawer" : "inline"} open={filtersOpen} filters={filters} components={components}
                onChange={(nextFilters) => { setFilters(nextFilters); setSelectedId(null); }}
                onClear={() => { setFilters(initialFilters); setSelectedId(null); }}
                onClose={() => { if (compactLayout) setCompactFiltersOpen(false); else setFiltersVisible(false); }} />

              <section className={styles.area} aria-label="Área de exploração">
                <div className={styles.mapToolbar}>
                  <div className={styles.toolbarGroup}><Button appearance={filtersOpen ? "subtle" : "outline"} icon={<FilterRegular />} aria-expanded={filtersOpen} aria-controls={filtersPanelId} aria-haspopup={compactLayout ? "dialog" : undefined} onClick={() => { if (compactLayout) setCompactFiltersOpen(!compactFiltersOpen); else setFiltersVisible(!filtersVisible); }}>Filtros</Button><TabList size="small" selectedValue={display} onTabSelect={(_, data) => setDisplay(data.value as "graph" | "list")} aria-label="Visualização dos componentes"><Tab value="graph" icon={<MapRegular />}>Mapa</Tab><Tab value="list" icon={<ListRegular />}>Lista</Tab></TabList></div>
                  <div className={styles.toolbarGroup}><Text size={200} className={styles.muted}>{filtered.components.length} de {components.length} componentes{contextCount ? ` · ${contextCount} de contexto` : ""}</Text><Tooltip content="Exportar dados fictícios em JSON" relationship="label"><Button appearance="subtle" icon={<ArrowDownloadRegular />} aria-label="Exportar snapshot de demonstração" onClick={exportSnapshot} /></Tooltip></div>
                </div>

                {runState === "running" && <div className={styles.stage}><div className={styles.statusLine}><span role="status">Etapa {step + 1} de 4 · {phases[step]}</span><Button size="small" appearance="subtle" onClick={cancelSimulation}>Cancelar simulação</Button></div><ProgressBar value={(step + 1) / 4} aria-label="Progresso da simulação" /></div>}

                <div className={styles.problemStrip}>
                  <WarningRegular className={styles.problemIcon} aria-hidden />
                  <div className={styles.problemText}><Text size={200} weight="semibold">Cotação auto precisa de atenção</Text><Text className={styles.muted}>p95 de 842 ms · SLO fictício de 500 ms · {problems} componentes com sinais de degradação</Text></div>
                  <Button size="small" appearance="subtle" icon={<ArrowRightRegular />} iconPosition="after" onClick={() => { setFilters(initialFilters); setSelectedId("quote"); }}>Ver evidências</Button>
                </div>

                {display === "graph" ? <div className={styles.graph}>
                  <TopologyCanvas components={filtered.components} relations={filtered.relations} selectedId={selectedId} onSelect={setSelectedId} />
                  {selected && filtered.components.some((component) => component.id === selected.id) && <ComponentDetails component={selected} period={period} onClose={() => setSelectedId(null)} onHelp={() => openHelp(selected.kind)} />}
                </div> : <div className={styles.tableWrap}>
                  <Table aria-label="Componentes do mapa"><TableHeader><TableRow><TableHeaderCell>Componente</TableHeaderCell><TableHeaderCell>Tipo</TableHeaderCell><TableHeaderCell>Estado</TableHeaderCell><TableHeaderCell>p95</TableHeaderCell><TableHeaderCell>Ajuda</TableHeaderCell></TableRow></TableHeader><TableBody>{filtered.components.map((component) => <TableRow key={component.id}><TableCell><Button appearance="subtle" className={styles.tableButton} onClick={() => { setSelectedId(component.id); setDisplay("graph"); }}>{component.name}</Button></TableCell><TableCell>{kindLabels[component.kind]}</TableCell><TableCell>{statusLabels[component.status]}{component.contextOnly ? " · contexto" : ""}</TableCell><TableCell>{component.latency ?? "Sem dados"}</TableCell><TableCell><Button appearance="subtle" icon={<QuestionCircleRegular />} aria-label={`Entender tipo ${kindLabels[component.kind]}`} onClick={() => openHelp(component.kind)} /></TableCell></TableRow>)}</TableBody></Table>
                  {filtered.components.length === 0 && <div className={styles.empty}><Text>Nenhum componente com esses filtros.</Text><Button onClick={() => setFilters(initialFilters)}>Limpar filtros</Button></div>}
                </div>}

                <footer className={styles.bottom}><span className={styles.inline}><InfoRegular aria-hidden />Fixture local · API e MCP não conectados</span><span>{sessionId} · escopo de demonstração</span></footer>
              </section>
            </div>
          </> : <section className={styles.history} aria-label="Histórico de sessões simuladas">
            <div className={styles.callout}><Text weight="semibold">Histórico de revisão</Text><Text className={styles.muted}>As sessões desta prévia ficam no armazenamento local do navegador. PostgreSQL, autenticação e consultas reais pertencem à integração com o SERVICE.</Text></div>
            {history.length === 0 ? <div className={styles.empty}><HistoryRegular fontSize={40} /><Text size={500} weight="semibold">Sua primeira investigação começa aqui</Text><Text className={styles.muted}>Faça uma busca simulada para explorar os estados e guardar uma sessão local.</Text><Button appearance="primary" icon={<AddRegular />} onClick={openSearch}>Nova busca</Button></div> : history.map((item) => <article className={styles.historyCard} key={item.id}><HistoryRegular fontSize={24} /><div className={styles.historyMain}><Text weight="semibold">{item.url.replace(/^https?:\/\//, "")}</Text><span className={styles.muted}>{item.id} · {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.createdAt))}</span></div><Badge appearance="tint" color={item.outcome === "cancelled" ? "subtle" : "success"}>{item.outcome === "cancelled" ? "Cancelada" : "Concluída"}</Badge><Button onClick={() => { setUrl(item.url); setSessionId(item.id); setView("map"); setSelectedId(null); setNotice("Sessão local reaberta com o mesmo mapa fictício da prévia."); }}>Abrir mapa</Button></article>)}
          </section>}
        </main>
      </div>

      <span role="status" aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}>{notice}</span>
      <HelpPanel open={helpOpen} onOpenChange={setHelpOpen} initialKind={helpKind} />
      <Dialog open={searchOpen} onOpenChange={(_, data) => setSearchOpen(data.open)}>
        <DialogSurface><form onSubmit={submitSearch}><DialogBody>
          <DialogTitle action={<Button appearance="subtle" icon={<DismissRegular />} aria-label="Fechar nova busca" onClick={() => setSearchOpen(false)} />}>Explore uma aplicação</DialogTitle>
          <DialogContent><Text className={styles.muted}>Informe o ponto de partida. Nesta prévia, a experiência usa um mapa fictício e não acessa a URL ou o Dynatrace.</Text><div className={styles.dialogForm}>
            <Field label="URL da aplicação" required validationState={validation ? "error" : "none"} validationMessage={validation || undefined}><Input value={draftUrl} onChange={(_, data) => { setDraftUrl(data.value); setValidation(""); }} placeholder="https://portoseguro.com.br/aplicacao-a" contentBefore={<GlobeRegular />} /></Field>
            <div className={styles.formRow}><Field label="Ambiente"><Select value={draftEnvironment} onChange={(_, data) => setDraftEnvironment(data.value)}><option>Produção</option><option>Homologação</option><option>Desenvolvimento</option></Select></Field><Field label="Período de análise"><Select value={draftPeriod} onChange={(_, data) => setDraftPeriod(data.value)}><option>Última hora</option><option>Últimas 6 horas</option><option>Últimas 24 horas</option></Select></Field></div>
            <div className={styles.callout}><Text weight="semibold">Desempenho e resiliência</Text><Text className={styles.muted}>Componentes, indicadores RED e evidências no contexto da aplicação. Sem investigação ilimitada.</Text></div>
          </div></DialogContent>
          <DialogActions><Button appearance="secondary" onClick={() => setSearchOpen(false)}>Cancelar</Button><Button appearance="primary" type="submit" icon={<SearchRegular />}>Iniciar simulação</Button></DialogActions>
        </DialogBody></form></DialogSurface>
      </Dialog>
    </div>
  );
}
