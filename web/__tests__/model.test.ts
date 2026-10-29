import { filterMap, type ComponentKind, type MapComponent, type MapFilters, type MapRelationship } from "@/features/map/model";

const kinds: ComponentKind[] = ["ENTRY", "FRONTEND", "SERVICE", "DATABASE", "EXTERNAL", "WORKLOAD", "HOST", "MESSAGING"];

function component(id: string, properties: Partial<MapComponent> = {}): MapComponent {
  return {
    id,
    name: id,
    kind: "SERVICE",
    status: "healthy",
    technology: "Java",
    detail: "Componente fictício para verificar o contexto de investigação.",
    externalId: `SERVICE-${id.toUpperCase()}`,
    evidenceScope: "SERVICE",
    evidence: "Evidência de demonstração.",
    owner: "SRE",
    position: { x: 0, y: 0 },
    ...properties,
  };
}

function filters(properties: Partial<MapFilters> = {}): MapFilters {
  return { query: "", kinds, onlyProblems: false, showInfrastructure: false, keepContext: true, ...properties };
}

const components: MapComponent[] = [
  component("entry", { kind: "ENTRY", status: "unknown", name: "/aplicacao-a" }),
  component("frontend", { kind: "FRONTEND", name: "Portal" }),
  component("gateway", { name: "Gateway" }),
  component("quote", { name: "Cotação auto", status: "critical", externalId: "SERVICE-QUOTE-42" }),
  component("unrelated", { name: "Identidade" }),
  component("database", { kind: "DATABASE", technology: "PostgreSQL" }),
  component("workload", { kind: "WORKLOAD", name: "cotacao-auto", status: "warning", evidenceScope: "INFRASTRUCTURE" }),
  component("host", { kind: "HOST", name: "worker-a", status: "critical", evidenceScope: "INFRASTRUCTURE" }),
];

const relations: MapRelationship[] = [
  { id: "entry-frontend", source: "entry", target: "frontend", kind: "BELONGS_TO" },
  { id: "frontend-gateway", source: "frontend", target: "gateway", kind: "CALLS" },
  { id: "gateway-quote", source: "gateway", target: "quote", kind: "CALLS" },
  { id: "gateway-unrelated", source: "gateway", target: "unrelated", kind: "CALLS" },
  { id: "quote-database", source: "quote", target: "database", kind: "CALLS" },
  { id: "quote-workload", source: "quote", target: "workload", kind: "RUNS_ON" },
  { id: "workload-host", source: "workload", target: "host", kind: "RUNS_ON" },
];

describe("filterMap: contexto de triagem sem coleta remota", () => {
  test("preserva o caminho de entrada mesmo quando tipo e saúde filtram somente o serviço degradado", () => {
    const result = filterMap(components, relations, filters({ kinds: ["SERVICE"], onlyProblems: true }));

    expect(result.components.map((item) => item.id)).toEqual(["entry", "frontend", "gateway", "quote"]);
    expect(result.components.find((item) => item.id === "quote")?.contextOnly).toBe(false);
    expect(result.components.filter((item) => item.contextOnly).map((item) => item.id)).toEqual(["entry", "frontend", "gateway"]);
    expect(result.relations.map((relation) => relation.id)).toEqual(["entry-frontend", "frontend-gateway", "gateway-quote"]);
  });

  test.each(["  COTAÇÃO  ", "service-quote-42"])("encontra nome ou ID sem distinguir caixa e conserva contexto: %s", (query) => {
    const result = filterMap(components, relations, filters({ query }));

    expect(result.components.find((item) => item.id === "quote")?.contextOnly).toBe(false);
    expect(result.components.map((item) => item.id)).toEqual(["entry", "frontend", "gateway", "quote"]);
  });

  test("permite ocultar contexto sem manter arestas penduradas", () => {
    const result = filterMap(components, relations, filters({ query: "SERVICE-QUOTE-42", keepContext: false }));

    expect(result.components.map((item) => item.id)).toEqual(["quote"]);
    expect(result.relations).toEqual([]);
  });

  test("infraestrutura oculta não reaparece como contexto de um filtro", () => {
    const result = filterMap(components, relations, filters({ onlyProblems: true, showInfrastructure: false }));

    expect(result.components.map((item) => item.id)).toEqual(["entry", "frontend", "gateway", "quote"]);
    expect(result.components.some((item) => item.kind === "HOST" || item.kind === "WORKLOAD")).toBe(false);
    expect(result.relations.some((item) => item.kind === "RUNS_ON")).toBe(false);
  });

  test("mostra a cadeia de execução conhecida quando a infraestrutura é explicitamente habilitada", () => {
    const result = filterMap(components, relations, filters({ query: "worker-a", showInfrastructure: true }));

    expect(result.components.map((item) => item.id)).toEqual(["entry", "frontend", "gateway", "quote", "workload", "host"]);
    expect(result.components.find((item) => item.id === "host")?.contextOnly).toBe(false);
    expect(result.relations.map((item) => item.id)).toContain("workload-host");
    expect(result.components.some((item) => item.id === "unrelated")).toBe(false);
  });

  test("termina em grafos cíclicos, sem duplicar nós nem incorporar referências ausentes", () => {
    const cyclicRelations: MapRelationship[] = [
      ...relations,
      { id: "quote-gateway-cycle", source: "quote", target: "gateway", kind: "CALLS" },
      { id: "missing-quote", source: "missing", target: "quote", kind: "CALLS" },
    ];
    const result = filterMap(components, cyclicRelations, filters({ query: "SERVICE-QUOTE-42" }));
    const ids = result.components.map((item) => item.id);

    expect(ids).toEqual(["entry", "frontend", "gateway", "quote"]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(result.relations.map((item) => item.id)).toContain("quote-gateway-cycle");
    expect(result.relations.every((item) => ids.includes(item.source) && ids.includes(item.target))).toBe(true);
  });

  test("não confunde filtro vazio com falha ou descarte de componentes do snapshot", () => {
    const original = JSON.stringify({ components, relations });
    const empty = filterMap(components, relations, filters({ query: "componente-inexistente" }));
    const restored = filterMap(components, relations, filters());

    expect(empty).toEqual({ components: [], relations: [] });
    expect(restored.components.some((item) => item.id === "quote")).toBe(true);
    expect(JSON.stringify({ components, relations })).toBe(original);
    expect(components.every((item) => item.contextOnly === undefined)).toBe(true);
  });

  test("vinte alterações de filtros não despacham requests remotos", () => {
    const previousFetch = Object.getOwnPropertyDescriptor(globalThis, "fetch");
    const remoteRequest = jest.fn();
    Object.defineProperty(globalThis, "fetch", { configurable: true, writable: true, value: remoteRequest });
    const xhrOpen = jest.spyOn(XMLHttpRequest.prototype, "open");

    try {
      for (let index = 0; index < 20; index++) {
        filterMap(components, relations, filters({
          query: index % 2 ? "quote" : "",
          onlyProblems: index % 3 === 0,
          showInfrastructure: index % 4 === 0,
          keepContext: index % 5 !== 0,
        }));
      }
      expect(remoteRequest).not.toHaveBeenCalled();
      expect(xhrOpen).not.toHaveBeenCalled();
    } finally {
      xhrOpen.mockRestore();
      if (previousFetch) Object.defineProperty(globalThis, "fetch", previousFetch);
      else Reflect.deleteProperty(globalThis, "fetch");
    }
  });
});
