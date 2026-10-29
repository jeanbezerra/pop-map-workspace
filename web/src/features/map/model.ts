export type ComponentKind =
  | "ENTRY" | "FRONTEND" | "SERVICE" | "DATABASE" | "EXTERNAL"
  | "WORKLOAD" | "HOST" | "MESSAGING";

export type HealthStatus = "critical" | "warning" | "healthy" | "unknown";

export interface MapComponent {
  id: string;
  name: string;
  kind: ComponentKind;
  status: HealthStatus;
  technology: string;
  detail: string;
  latency?: string;
  errorRate?: string;
  requests?: string;
  externalId: string;
  evidenceScope: "ROUTE" | "FRONTEND" | "SERVICE" | "INFRASTRUCTURE";
  evidence: string;
  owner: string;
  position: { x: number; y: number };
  replicaCount?: number;
  contextOnly?: boolean;
}

export interface MapRelationship {
  id: string;
  source: string;
  target: string;
  kind: "CALLS" | "RUNS_ON" | "BELONGS_TO";
  label?: string;
  degraded?: boolean;
}

export interface MapFilters {
  query: string;
  kinds: ComponentKind[];
  onlyProblems: boolean;
  showInfrastructure: boolean;
  keepContext?: boolean;
}

export type RunState = "idle" | "running" | "completed" | "cancelled";

export interface SearchHistoryItem {
  id: string;
  url: string;
  createdAt: string;
  outcome: "completed" | "partial" | "cancelled";
}

export const kindLabels: Record<ComponentKind, string> = {
  ENTRY: "Entrada / rota",
  FRONTEND: "Frontend",
  SERVICE: "Serviço",
  DATABASE: "Banco de dados",
  EXTERNAL: "Dependência externa",
  WORKLOAD: "Workload Kubernetes",
  HOST: "Host / nó",
  MESSAGING: "Mensageria",
};

export const statusLabels: Record<HealthStatus, string> = {
  critical: "Problema ativo",
  warning: "Atenção",
  healthy: "Sem violação",
  unknown: "Sem dados",
};

export function filterMap(
  components: MapComponent[],
  relations: MapRelationship[],
  filters: MapFilters,
) {
  const query = filters.query.trim().toLocaleLowerCase("pt-BR");
  const eligible = components.filter((component) => {
    if (!filters.showInfrastructure && ["WORKLOAD", "HOST"].includes(component.kind)) return false;
    return true;
  });
  const matched = eligible.filter((component) => {
    if (!filters.kinds.includes(component.kind)) return false;
    if (filters.onlyProblems && !["critical", "warning"].includes(component.status)) return false;
    return !query || `${component.name} ${component.technology} ${component.externalId}`
      .toLocaleLowerCase("pt-BR").includes(query);
  });
  const ids = new Set(matched.map((component) => component.id));
  const matches = new Set(ids);
  if (filters.keepContext !== false && ids.size > 0) {
    const allowed = new Set(eligible.map((component) => component.id));
    const queue = [...ids];
    for (let index = 0; index < queue.length; index++) {
      for (const relation of relations) {
        if (relation.target === queue[index] && allowed.has(relation.source) && !ids.has(relation.source)) {
          ids.add(relation.source);
          queue.push(relation.source);
        }
      }
    }
  }
  const visible = eligible.filter((component) => ids.has(component.id))
    .map((component) => ({ ...component, contextOnly: !matches.has(component.id) }));
  return {
    components: visible,
    relations: relations.filter((relation) => ids.has(relation.source) && ids.has(relation.target)),
  };
}
