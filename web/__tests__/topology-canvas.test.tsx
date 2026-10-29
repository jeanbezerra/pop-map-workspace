import { render } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import type { ReactFlowProps } from "@xyflow/react";
import { TopologyCanvas } from "@/features/map/topology-canvas";
import { demoComponents, demoRelations } from "@/features/map/demo-data";

const mockRegistries: Array<Pick<ReactFlowProps, "nodeTypes" | "edgeTypes">> = [];

jest.mock("@xyflow/react", () => {
  const actual = jest.requireActual<typeof import("@xyflow/react")>("@xyflow/react");
  return {
    ...actual,
    ReactFlow: (props: ReactFlowProps) => {
      mockRegistries.push({ nodeTypes: props.nodeTypes, edgeTypes: props.edgeTypes });
      return <actual.ReactFlow {...props} />;
    },
  };
});

describe("registro de tipos do canvas", () => {
  beforeEach(() => { mockRegistries.length = 0; });

  test("seleção, novos dados e filtros não substituem os tipos nem remontam o mapa", () => {
    const onSelect = jest.fn();
    const canvas = (selectedId: string | null, filtered = false) => <FluentProvider theme={webLightTheme}>
      <TopologyCanvas components={filtered ? demoComponents.slice(0, 4) : [...demoComponents]} relations={filtered ? demoRelations.slice(0, 3) : [...demoRelations]} selectedId={selectedId} onSelect={onSelect} />
    </FluentProvider>;
    const view = render(canvas(null));
    const initialPane = view.container.querySelector(".react-flow__pane");
    const firstRegistry = mockRegistries[0];
    expect(initialPane).not.toBeNull();
    expect(firstRegistry.nodeTypes?.component).toBeDefined();

    view.rerender(canvas("quote"));
    view.rerender(canvas("frontend", true));
    view.rerender(canvas(null));

    expect(view.container.querySelector(".react-flow__pane")).toBe(initialPane);
    expect(mockRegistries.length).toBeGreaterThan(1);
    for (const registry of mockRegistries) {
      expect(registry.nodeTypes).toBe(firstRegistry.nodeTypes);
      expect(registry.nodeTypes?.component).toBe(firstRegistry.nodeTypes?.component);
      expect(registry.edgeTypes).toBe(firstRegistry.edgeTypes);
    }
  });
});
