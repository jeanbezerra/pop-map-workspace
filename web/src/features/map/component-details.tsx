"use client";

import { Badge, Button, Divider, Text, makeStyles, tokens } from "@fluentui/react-components";
import { DismissRegular, DocumentSearchRegular, InfoRegular, QuestionCircleRegular, WarningRegular } from "@fluentui/react-icons";
import { kindLabels, statusLabels, type MapComponent } from "./model";

const useStyles = makeStyles({
  panel: { position: "absolute", top: "16px", right: "16px", bottom: "100px", zIndex: 6, width: "310px", maxWidth: "calc(100% - 32px)", display: "flex", flexDirection: "column", backgroundColor: tokens.colorNeutralBackground1, border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusLarge, boxShadow: tokens.shadow16, overflow: "auto" },
  header: { padding: tokens.spacingHorizontalL, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: tokens.spacingHorizontalS },
  body: { padding: tokens.spacingHorizontalL, paddingTop: 0, display: "flex", flexDirection: "column", gap: tokens.spacingVerticalL },
  title: { margin: 0, fontSize: tokens.fontSizeBase500, lineHeight: tokens.lineHeightBase500, fontWeight: tokens.fontWeightSemibold },
  label: { display: "block", fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3, marginBottom: tokens.spacingVerticalS },
  paragraph: { fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground2, lineHeight: tokens.lineHeightBase300, margin: 0 },
  metrics: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: tokens.spacingHorizontalM },
  metric: { padding: tokens.spacingHorizontalM, backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusMedium },
  metricValue: { fontSize: tokens.fontSizeBase500, fontWeight: tokens.fontWeightSemibold },
  note: { padding: tokens.spacingHorizontalM, backgroundColor: tokens.colorNeutralBackground2, borderRadius: tokens.borderRadiusMedium, display: "flex", flexDirection: "column", gap: tokens.spacingVerticalS },
  iconLabel: { display: "flex", alignItems: "center", gap: tokens.spacingHorizontalS },
  id: { overflowWrap: "anywhere", fontSize: tokens.fontSizeBase100, fontFamily: tokens.fontFamilyMonospace, color: tokens.colorNeutralForeground3 },
});

export function ComponentDetails({ component, period, onClose, onHelp }: {
  component: MapComponent; period: string; onClose: () => void; onHelp: () => void;
}) {
  const styles = useStyles();
  return (
    <aside className={styles.panel} aria-label={`Detalhes de ${component.name}`} onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}>
      <div className={styles.header}>
        <div><span className={styles.label}>{kindLabels[component.kind]}</span><h2 className={styles.title}>{component.name}</h2></div>
        <Button appearance="subtle" icon={<DismissRegular />} aria-label="Fechar detalhes do componente" onClick={onClose} />
      </div>
      <div className={styles.body}>
        <Badge appearance="tint" color={component.status === "critical" ? "danger" : component.status === "warning" ? "warning" : component.status === "healthy" ? "success" : "subtle"}>{statusLabels[component.status]}</Badge>
        <p className={styles.paragraph}>{component.detail}</p>
        <Button icon={<QuestionCircleRegular />} appearance="outline" onClick={onHelp}>O que é este componente?</Button>
        <Divider />
        <div><Text weight="semibold">Indicadores demonstrativos</Text><span className={styles.label}>{period} · dados fictícios</span>
          <div className={styles.metrics}>
            <div className={styles.metric}><span className={styles.label}>Latência p95</span><Text className={styles.metricValue}>{component.latency ?? "—"}</Text></div>
            <div className={styles.metric}><span className={styles.label}>Falhas</span><Text className={styles.metricValue}>{component.errorRate ?? "—"}</Text></div>
          </div>
          {!component.latency && <p className={styles.paragraph}>Sem medição disponível neste exemplo.</p>}
        </div>
        {component.status === "critical" && <div className={styles.note}><span className={styles.iconLabel}><WarningRegular /><Text weight="semibold">P-2408 · exemplo de problema</Text></span><p className={styles.paragraph}>Latência acima do SLO fictício de 500 ms. A relação com outras degradações é uma correlação, sem causa confirmada.</p></div>}
        <div><span className={styles.iconLabel}><DocumentSearchRegular /><Text weight="semibold">Evidência e abrangência</Text></span><p className={styles.paragraph}>{component.evidence}</p><span className={styles.id}>Escopo: {component.evidenceScope}</span></div>
        <div className={styles.note}><span className={styles.iconLabel}><InfoRegular /><Text size={200} weight="semibold">Origem da prévia</Text></span><p className={styles.paragraph}>Fixture local. Esta tela não executa consultas no Dynatrace.</p></div>
        <div><span className={styles.label}>Time responsável no exemplo</span><Text>{component.owner}</Text></div>
        <div><span className={styles.label}>Identificador demonstrativo</span><span className={styles.id}>{component.externalId}</span></div>
      </div>
    </aside>
  );
}
