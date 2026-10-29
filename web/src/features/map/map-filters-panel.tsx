"use client";

import { useId } from "react";
import {
  Badge, Button, Checkbox, Divider, DrawerBody, DrawerFooter, DrawerHeader,
  DrawerHeaderTitle, Field, Input, OverlayDrawer, Text, makeStyles, tokens,
} from "@fluentui/react-components";
import { DismissRegular, InfoRegular, SearchRegular } from "@fluentui/react-icons";
import { kindLabels, type ComponentKind, type MapComponent, type MapFilters } from "./model";

export interface MapFiltersPanelProps {
  id?: string;
  presentation: "inline" | "drawer";
  open: boolean;
  filters: MapFilters;
  components: MapComponent[];
  onChange: (filters: MapFilters) => void;
  onClear: () => void;
  onClose: () => void;
}

const useStyles = makeStyles({
  panel: {
    width: "288px", flex: "0 0 288px", minWidth: 0, minHeight: 0,
    display: "flex", flexDirection: "column", overflow: "hidden",
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`, backgroundColor: tokens.colorNeutralBackground1,
    "@media (max-width: 1099px)": { display: "none" },
  },
  header: {
    flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
    gap: tokens.spacingHorizontalM, padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  title: { margin: 0, fontSize: tokens.fontSizeBase400, lineHeight: tokens.lineHeightBase400, fontWeight: tokens.fontWeightSemibold },
  body: {
    flex: "1 1 auto", minHeight: 0, overflowY: "auto", overflowX: "hidden",
    overscrollBehaviorY: "contain", scrollbarGutter: "stable",
    padding: tokens.spacingHorizontalL,
  },
  content: { display: "flex", flexDirection: "column", gap: tokens.spacingVerticalL, minWidth: 0, "> *": { flexShrink: 0 } },
  field: { width: "100%", minWidth: 0 },
  input: { width: "100%", minWidth: 0 },
  group: { margin: 0, padding: 0, border: 0, minWidth: 0, display: "flex", flexDirection: "column", gap: tokens.spacingVerticalS, flexShrink: 0 },
  legend: { padding: 0, marginBottom: tokens.spacingVerticalM, fontSize: tokens.fontSizeBase200, lineHeight: tokens.lineHeightBase300, fontWeight: tokens.fontWeightSemibold, color: tokens.colorNeutralForeground2 },
  option: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", alignItems: "start", gap: tokens.spacingHorizontalS, flexShrink: 0 },
  checkbox: { minWidth: 0, width: "100%", alignItems: "flex-start" },
  optionLabel: { minWidth: 0, whiteSpace: "normal", overflowWrap: "anywhere", lineHeight: tokens.lineHeightBase300 },
  count: { paddingTop: tokens.spacingVerticalS, fontSize: tokens.fontSizeBase100, color: tokens.colorNeutralForeground3, fontVariantNumeric: "tabular-nums", flexShrink: 0 },
  note: { display: "flex", alignItems: "flex-start", gap: tokens.spacingHorizontalS, padding: tokens.spacingHorizontalM, backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusMedium, fontSize: tokens.fontSizeBase200, lineHeight: tokens.lineHeightBase300, color: tokens.colorNeutralForeground2 },
  noteIcon: { flexShrink: 0, fontSize: "20px", color: tokens.colorBrandForeground1 },
  source: { display: "flex", justifyContent: "space-between", flexWrap: "wrap", alignItems: "center", gap: tokens.spacingHorizontalS, fontSize: tokens.fontSizeBase200 },
  footer: { display: "flex", flexShrink: 0, flexWrap: "wrap", justifyContent: "space-between", gap: tokens.spacingHorizontalS, padding: tokens.spacingHorizontalL, borderTop: `1px solid ${tokens.colorNeutralStroke2}`, backgroundColor: tokens.colorNeutralBackground1 },
  drawer: { width: "min(340px, 100vw)", maxWidth: "100vw" },
});

function FilterContent({ filters, components, onChange }: Pick<MapFiltersPanelProps, "filters" | "components" | "onChange">) {
  const styles = useStyles();
  const kinds = (Object.keys(kindLabels) as ComponentKind[])
    .filter((kind) => filters.showInfrastructure || !["WORKLOAD", "HOST"].includes(kind));
  const label = (text: string) => ({ children: text, className: styles.optionLabel });

  return <div className={styles.content}>
    <Field className={styles.field} label="Buscar componente">
      <Input className={styles.input} value={filters.query} onChange={(_, data) => onChange({ ...filters, query: data.value })} contentBefore={<SearchRegular />} placeholder="Nome, tecnologia ou ID" />
    </Field>
    <fieldset className={styles.group}>
      <legend className={styles.legend}>Tipos de componentes</legend>
      {kinds.map((kind) => <div className={styles.option} key={kind}>
        <Checkbox className={styles.checkbox} label={label(kindLabels[kind])} checked={filters.kinds.includes(kind)} onChange={(_, data) => onChange({ ...filters, kinds: data.checked ? [...filters.kinds, kind] : filters.kinds.filter((value) => value !== kind) })} />
        <span className={styles.count} aria-label={`${components.filter((component) => component.kind === kind).length} componentes desse tipo`}>{components.filter((component) => component.kind === kind).length}</span>
      </div>)}
    </fieldset>
    <Divider />
    <fieldset className={styles.group}>
      <legend className={styles.legend}>Contexto da investigação</legend>
      <Checkbox className={styles.checkbox} label={label("Somente com problemas")} checked={filters.onlyProblems} onChange={(_, data) => onChange({ ...filters, onlyProblems: !!data.checked })} />
      <Checkbox className={styles.checkbox} label={label("Manter caminho até a entrada")} checked={filters.keepContext} onChange={(_, data) => onChange({ ...filters, keepContext: !!data.checked })} />
      <Checkbox className={styles.checkbox} label={label("Mostrar infraestrutura")} checked={filters.showInfrastructure} onChange={(_, data) => onChange({ ...filters, showInfrastructure: !!data.checked })} />
    </fieldset>
    <Divider />
    <section className={styles.group} aria-label="Fontes da demonstração">
      <Text size={200} weight="semibold">Fontes da demonstração</Text>
      <div className={styles.source}><span>Dynatrace API</span><Badge appearance="outline" size="small">Simulada</Badge></div>
      <div className={styles.source}><span>Enriquecimento MCP</span><Badge appearance="outline" size="small">Não conectado</Badge></div>
    </section>
    <div className={styles.note}><InfoRegular className={styles.noteIcon} aria-hidden /><span>Filtros e navegação usam o mapa já carregado, sem novas consultas.</span></div>
  </div>;
}

export function MapFiltersPanel({ id, presentation, open, filters, components, onChange, onClear, onClose }: MapFiltersPanelProps) {
  const styles = useStyles();
  const titleId = useId();
  const content = <FilterContent filters={filters} components={components} onChange={onChange} />;

  if (presentation === "drawer") return <OverlayDrawer id={id} className={styles.drawer} position="start" size="small" open={open} onOpenChange={(_, data) => { if (!data.open) onClose(); }} aria-labelledby={titleId}>
    <DrawerHeader><DrawerHeaderTitle id={titleId} action={<Button appearance="subtle" icon={<DismissRegular />} aria-label="Fechar filtros" onClick={onClose} />}>Filtros do mapa</DrawerHeaderTitle></DrawerHeader>
    <DrawerBody className={styles.body}>{open && content}</DrawerBody>
    <DrawerFooter className={styles.footer}><Button onClick={onClear}>Limpar filtros</Button><Button appearance="primary" onClick={onClose}>Ver mapa</Button></DrawerFooter>
  </OverlayDrawer>;

  if (!open) return null;
  return <aside id={id} className={styles.panel} aria-labelledby={titleId}>
    <header className={styles.header}><h2 className={styles.title} id={titleId}>Filtros do mapa</h2><Button appearance="subtle" icon={<DismissRegular />} aria-label="Recolher filtros" onClick={onClose} /></header>
    <div className={styles.body}>{content}</div>
    <footer className={styles.footer}><Button onClick={onClear}>Limpar filtros</Button></footer>
  </aside>;
}
