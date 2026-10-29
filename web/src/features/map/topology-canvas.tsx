"use client";

import { memo, useMemo, type ReactElement } from "react";
import {
  Badge,
  Button,
  Text,
  Tooltip,
  makeStyles,
  mergeClasses,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import {
  AddRegular,
  ArrowRightRegular,
  BoxMultipleRegular,
  CheckmarkCircleRegular,
  CloudRegular,
  DatabaseRegular,
  DesktopTowerRegular,
  ErrorCircleRegular,
  FullScreenMaximizeRegular,
  GlobeRegular,
  QuestionCircleRegular,
  ServerRegular,
  SubtractRegular,
  WarningRegular,
  WindowRegular,
} from "@fluentui/react-icons";
import {
  Background,
  BackgroundVariant,
  Handle,
  MarkerType,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useViewport,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import {
  kindLabels,
  statusLabels,
  type ComponentKind,
  type MapComponent,
  type MapRelationship,
} from "./model";

export interface TopologyCanvasProps {
  components: MapComponent[];
  relations: MapRelationship[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

type ComponentNode = Node<{ component: MapComponent }, "component">;

const useStyles = makeStyles({
  canvas: {
    width: "100%",
    height: "100%",
    minHeight: 0,
    position: "relative",
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    overflow: "hidden",
  },
  node: {
    width: "204px",
    boxSizing: "border-box",
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    ...shorthands.border(tokens.strokeWidthThin, "solid", tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: tokens.shadow2,
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    cursor: "pointer",
    ":hover": {
      borderTopColor: tokens.colorNeutralStroke1Hover,
      borderRightColor: tokens.colorNeutralStroke1Hover,
      borderBottomColor: tokens.colorNeutralStroke1Hover,
      borderLeftColor: tokens.colorNeutralStroke1Hover,
      boxShadow: tokens.shadow4,
    },
    "@media (forced-colors: active)": {
      ...shorthands.borderColor("CanvasText"),
    },
  },
  selected: {
    ...shorthands.borderColor(tokens.colorBrandStroke1),
    boxShadow: `0 0 0 2px ${tokens.colorBrandStroke1}, ${tokens.shadow8}`,
    "@media (forced-colors: active)": {
      outline: "2px solid Highlight",
    },
  },
  critical: { borderLeftWidth: "3px", borderLeftColor: tokens.colorStatusDangerForeground1 },
  warning: { borderLeftWidth: "3px", borderLeftColor: tokens.colorStatusWarningForeground1 },
  contextOnly: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderTopStyle: "dashed",
    borderRightStyle: "dashed",
    borderBottomStyle: "dashed",
  },
  nodeHeader: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  icon: {
    width: "32px",
    height: "32px",
    display: "grid",
    placeItems: "center",
    color: tokens.colorBrandForeground1,
    backgroundColor: tokens.colorBrandBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    fontSize: "20px",
    flexShrink: 0,
  },
  iconNeutral: {
    color: tokens.colorNeutralForeground2,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  kind: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase100,
    lineHeight: tokens.lineHeightBase100,
    display: "block",
    marginBottom: tokens.spacingVerticalXXS,
  },
  name: {
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightBase300,
    overflowWrap: "anywhere",
    display: "block",
  },
  technology: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    lineHeight: tokens.lineHeightBase200,
  },
  metadata: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
  },
  nodeFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalS,
    borderTop: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke3}`,
    paddingTop: tokens.spacingVerticalS,
    marginTop: tokens.spacingVerticalXXS,
  },
  metric: {
    display: "flex",
    alignItems: "baseline",
    gap: tokens.spacingHorizontalXS,
    whiteSpace: "nowrap",
  },
  metricLabel: { color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase100 },
  metricValue: { fontSize: tokens.fontSizeBase200, fontWeight: tokens.fontWeightSemibold },
  handle: {
    width: "7px",
    height: "7px",
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
  },
  context: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border(tokens.strokeWidthThin, "solid", tokens.colorNeutralStroke2),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
  },
  contextTitle: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  contextHint: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
  },
  controls: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXXS,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalXS),
    ...shorthands.border(tokens.strokeWidthThin, "solid", tokens.colorNeutralStroke2),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    boxShadow: tokens.shadow4,
  },
  controlButton: { minWidth: "44px", height: "44px" },
  zoomValue: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    minWidth: "44px",
    textAlign: "center",
    fontVariantNumeric: "tabular-nums",
  },
  legend: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase100,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border(tokens.strokeWidthThin, "solid", tokens.colorNeutralStroke2),
  },
  legendItem: { display: "inline-flex", alignItems: "center", gap: tokens.spacingHorizontalXS },
  callLine: { display: "inline-block", width: "20px", borderTop: `2px solid ${tokens.colorNeutralForeground3}` },
  infraLine: { display: "inline-block", width: "20px", borderTop: `2px dashed ${tokens.colorNeutralForeground3}` },
  warningIcon: { color: tokens.colorStatusWarningForeground1, fontSize: "16px" },
  empty: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    ...shorthands.padding(tokens.spacingVerticalXXXL, tokens.spacingHorizontalXXXL),
    textAlign: "center",
    color: tokens.colorNeutralForeground3,
  },
  emptyIcon: { color: tokens.colorNeutralForeground3, fontSize: "32px" },
});

function ComponentIcon({ kind }: { kind: ComponentKind }): ReactElement {
  switch (kind) {
    case "ENTRY": return <GlobeRegular aria-hidden />;
    case "FRONTEND": return <WindowRegular aria-hidden />;
    case "SERVICE": return <ServerRegular aria-hidden />;
    case "DATABASE": return <DatabaseRegular aria-hidden />;
    case "EXTERNAL": return <CloudRegular aria-hidden />;
    case "WORKLOAD": return <BoxMultipleRegular aria-hidden />;
    case "HOST": return <DesktopTowerRegular aria-hidden />;
    case "MESSAGING": return <BoxMultipleRegular aria-hidden />;
  }
}

const ComponentCard = memo(function ComponentCard({ data, selected }: NodeProps<ComponentNode>): ReactElement {
  const styles = useStyles();
  const component = data.component;
  const statusIcon = component.status === "critical" ? <ErrorCircleRegular />
    : component.status === "warning" ? <WarningRegular />
      : component.status === "healthy" ? <CheckmarkCircleRegular /> : <QuestionCircleRegular />;
  const statusColor = component.status === "critical" ? "danger"
    : component.status === "warning" ? "warning" : component.status === "healthy" ? "success" : "subtle";

  return (
    <div className={mergeClasses(styles.node, component.contextOnly && styles.contextOnly, selected && styles.selected,
      component.status === "critical" && styles.critical,
      component.status === "warning" && styles.warning)}>
      <Handle className={styles.handle} type="target" position={Position.Left} isConnectable={false} />
      <div className={styles.nodeHeader}>
        <span className={mergeClasses(styles.icon, ["ENTRY", "EXTERNAL", "HOST", "WORKLOAD"].includes(component.kind) && styles.iconNeutral)}>
          <ComponentIcon kind={component.kind} />
        </span>
        <div>
          <span className={styles.kind}>{kindLabels[component.kind]}</span>
          <span className={styles.name}>{component.name}</span>
        </div>
      </div>
      <div className={styles.metadata}>
        <span className={styles.technology}>{component.technology}</span>
        {component.contextOnly && <Badge appearance="outline" color="subtle" size="small">Contexto</Badge>}
      </div>
      <div className={styles.nodeFooter}>
        <Badge appearance="tint" color={statusColor} size="small" icon={statusIcon}>
          {statusLabels[component.status]}
        </Badge>
        {component.latency ? (
          <span className={styles.metric}>
            <span className={styles.metricLabel}>p95</span>
            <span className={styles.metricValue}>{component.latency}</span>
          </span>
        ) : component.replicaCount ? (
          <span className={styles.metricLabel}>{component.replicaCount} instâncias</span>
        ) : null}
      </div>
      <Handle className={styles.handle} type="source" position={Position.Right} isConnectable={false} />
    </div>
  );
});

const nodeTypes = { component: ComponentCard };

function ViewControls(): ReactElement {
  const styles = useStyles();
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { zoom } = useViewport();
  return (
    <Panel position="bottom-right" style={{ marginBottom: 34 }}>
      <div className={styles.controls} role="group" aria-label="Navegação do mapa">
        <Tooltip content="Diminuir zoom" relationship="label">
          <Button className={styles.controlButton} appearance="subtle" icon={<SubtractRegular />} aria-label="Diminuir zoom" onClick={() => void zoomOut({ duration: 0 })} />
        </Tooltip>
        <span className={styles.zoomValue} aria-label={`Zoom de ${Math.round(zoom * 100)} por cento`}>{Math.round(zoom * 100)}%</span>
        <Tooltip content="Aumentar zoom" relationship="label">
          <Button className={styles.controlButton} appearance="subtle" icon={<AddRegular />} aria-label="Aumentar zoom" onClick={() => void zoomIn({ duration: 0 })} />
        </Tooltip>
        <Tooltip content="Ajustar todos os componentes" relationship="label">
          <Button className={styles.controlButton} appearance="subtle" icon={<FullScreenMaximizeRegular />} aria-label="Ajustar todos os componentes" onClick={() => void fitView({ padding: 0.12, minZoom: 0.35, maxZoom: 1, duration: 0 })} />
        </Tooltip>
      </div>
    </Panel>
  );
}

function CanvasContent({ components, relations, selectedId, onSelect }: TopologyCanvasProps): ReactElement {
  const styles = useStyles();
  const nodes = useMemo<ComponentNode[]>(() => components.map((component) => ({
    id: component.id,
    type: "component",
    data: { component },
    position: component.position,
    selected: component.id === selectedId,
    draggable: false,
    connectable: false,
    deletable: false,
    ariaLabel: `${component.name}. ${kindLabels[component.kind]}. ${component.contextOnly ? "Mantido como contexto; não corresponde aos filtros. " : ""}${statusLabels[component.status]}. ${component.latency ? `p95 ${component.latency}.` : ""} Selecione para ver evidências.`,
  })), [components, selectedId]);

  const edges = useMemo<Edge[]>(() => relations.map((relation) => {
    const infrastructure = relation.kind !== "CALLS";
    const asynchronous = relation.label === "publica em";
    const stroke = relation.degraded ? tokens.colorStatusWarningForeground1 : tokens.colorNeutralStroke1;
    return {
      id: relation.id,
      source: relation.source,
      target: relation.target,
      type: "smoothstep",
      animated: false,
      selectable: false,
      focusable: false,
      label: relation.label ?? (infrastructure ? relation.kind === "RUNS_ON" ? "executa em" : "pertence a" : undefined),
      style: { stroke, strokeWidth: relation.degraded ? 2 : 1.5, strokeDasharray: infrastructure ? "5 5" : asynchronous ? "2 5" : undefined },
      labelStyle: { fill: tokens.colorNeutralForeground3, fontSize: 11 },
      labelBgStyle: { fill: tokens.colorNeutralBackground1 },
      labelBgPadding: [5, 3] as [number, number],
      markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: stroke },
    };
  }), [relations]);

  return (
    <section className={styles.canvas} aria-label="Mapa de componentes e dependências da aplicação">
      <ReactFlow<ComponentNode>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_event, node) => onSelect(node.id)}
        onNodesChange={(changes) => {
          for (const change of changes) {
            if (change.type === "select" && change.selected) {
              onSelect(change.id);
              break;
            }
          }
        }}
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable
        edgesFocusable={false}
        deleteKeyCode={null}
        selectionKeyCode={null}
        fitView
        fitViewOptions={{ padding: 0.12, minZoom: 0.65, maxZoom: 0.95 }}
        minZoom={0.35}
        maxZoom={1.75}
        zoomOnDoubleClick={false}
        attributionPosition="bottom-right"
        ariaLabelConfig={{
          "node.a11yDescription.default": "Pressione Enter ou Espaço para selecionar um componente. Use Tab para navegar.",
          "node.a11yDescription.keyboardDisabled": "Pressione Enter ou Espaço para selecionar um componente.",
          "edge.a11yDescription.default": "Relação entre componentes. A seta indica o destino.",
          "controls.zoomIn.ariaLabel": "Aumentar zoom",
          "controls.zoomOut.ariaLabel": "Diminuir zoom",
          "controls.fitView.ariaLabel": "Ajustar todos os componentes",
          "minimap.ariaLabel": "Miniatura do mapa",
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color={tokens.colorNeutralStroke2} />
        {components.length > 0 && <>
          <Panel position="top-left">
            <div className={styles.context}>
              <span className={styles.contextTitle}>Dependências da aplicação</span>
              <span className={styles.contextHint}>Chamador <ArrowRightRegular aria-hidden /> chamado · selecione para investigar</span>
            </div>
          </Panel>
          <Panel position="bottom-left" style={{ marginBottom: 38 }}>
            <div className={styles.legend} aria-label="Legenda das relações">
              <span className={styles.legendItem}><span className={styles.callLine} aria-hidden /> Chamada</span>
              <span className={styles.legendItem}><span className={styles.infraLine} aria-hidden /> Associação / execução</span>
              <span className={styles.legendItem}><WarningRegular className={styles.warningIcon} aria-hidden /> Sinal de degradação</span>
            </div>
          </Panel>
          <ViewControls />
        </>}
      </ReactFlow>
      {components.length === 0 && (
        <div className={styles.empty} role="status">
          <QuestionCircleRegular className={styles.emptyIcon} aria-hidden />
          <Text weight="semibold">Nenhum componente com esses filtros</Text>
          <Text size={200}>Ajuste a busca ou os tipos selecionados para explorar o mapa conhecido.</Text>
        </div>
      )}
    </section>
  );
}

export function TopologyCanvas(props: TopologyCanvasProps): ReactElement {
  return <ReactFlowProvider><CanvasContent {...props} /></ReactFlowProvider>;
}

export default TopologyCanvas;
