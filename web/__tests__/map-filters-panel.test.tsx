import { useState } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { MapFiltersPanel, type MapFiltersPanelProps } from "@/features/map/map-filters-panel";
import { demoComponents } from "@/features/map/demo-data";
import { kindLabels, type ComponentKind, type MapFilters } from "@/features/map/model";

function defaultFilters(): MapFilters {
  return { query: "", kinds: Object.keys(kindLabels) as ComponentKind[], onlyProblems: false, showInfrastructure: false, keepContext: true };
}

function FiltersHarness({ presentation, initiallyOpen = true }: {
  presentation: MapFiltersPanelProps["presentation"];
  initiallyOpen?: boolean;
}) {
  const [filters, setFilters] = useState(defaultFilters);
  const [open, setOpen] = useState(initiallyOpen);

  return <FluentProvider theme={webLightTheme}>
    <button onClick={() => setOpen(true)}>Abrir filtros</button>
    <MapFiltersPanel presentation={presentation} open={open} filters={filters} components={demoComponents}
      onChange={setFilters} onClear={() => setFilters(defaultFilters())} onClose={() => setOpen(false)} />
  </FluentProvider>;
}

describe("Filtros do mapa", () => {
  const originalFetch = Object.getOwnPropertyDescriptor(globalThis, "fetch");
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    Object.defineProperty(globalThis, "fetch", { configurable: true, writable: true, value: fetchMock });
  });

  afterEach(() => {
    expect(fetchMock).not.toHaveBeenCalled();
    if (originalFetch) Object.defineProperty(globalThis, "fetch", originalFetch);
    else Reflect.deleteProperty(globalThis, "fetch");
  });

  test.each(["inline", "drawer"] as const)("oferece uma única instância acessível dos campos na apresentação %s", (presentation) => {
    render(<FiltersHarness presentation={presentation} />);
    const panel = screen.getByRole(presentation === "drawer" ? "dialog" : "complementary", { name: "Filtros do mapa" });

    expect(screen.getAllByRole("textbox", { name: "Buscar componente" })).toHaveLength(1);
    expect(screen.getAllByRole("checkbox", { name: "Somente com problemas" })).toHaveLength(1);
    expect(within(panel).getByRole("group", { name: "Tipos de componentes" })).toBeVisible();
    expect(within(panel).getByRole("group", { name: "Contexto da investigação" })).toBeVisible();
    expect(within(panel).getByRole("button", { name: "Limpar filtros" })).toBeVisible();
  });

  test("fechar e reabrir o drawer preserva a investigação e permite limpar os filtros", async () => {
    render(<FiltersHarness presentation="drawer" initiallyOpen={false} />);
    expect(screen.queryByRole("dialog", { name: "Filtros do mapa" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Buscar componente" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Abrir filtros" }));
    const drawer = screen.getByRole("dialog", { name: "Filtros do mapa" });
    fireEvent.change(within(drawer).getByRole("textbox", { name: "Buscar componente" }), { target: { value: "cotação" } });
    fireEvent.click(within(drawer).getByRole("checkbox", { name: "Somente com problemas" }));
    fireEvent.click(within(drawer).getByRole("checkbox", { name: "Serviço" }));
    fireEvent.click(within(drawer).getByRole("button", { name: "Ver mapa" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Filtros do mapa" })).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Abrir filtros" }));
    const reopened = screen.getByRole("dialog", { name: "Filtros do mapa" });
    expect(within(reopened).getByRole("textbox", { name: "Buscar componente" })).toHaveValue("cotação");
    expect(within(reopened).getByRole("checkbox", { name: "Somente com problemas" })).toBeChecked();
    expect(within(reopened).getByRole("checkbox", { name: "Serviço" })).not.toBeChecked();

    fireEvent.click(within(reopened).getByRole("button", { name: "Limpar filtros" }));
    expect(within(reopened).getByRole("textbox", { name: "Buscar componente" })).toHaveValue("");
    expect(within(reopened).getByRole("checkbox", { name: "Somente com problemas" })).not.toBeChecked();
    expect(within(reopened).getByRole("checkbox", { name: "Serviço" })).toBeChecked();
    fireEvent.click(within(reopened).getByRole("button", { name: "Fechar filtros" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Filtros do mapa" })).not.toBeInTheDocument());
  });

  test("infraestrutura expõe seus tipos sob demanda sem perder a seleção ao ocultá-los", () => {
    render(<FiltersHarness presentation="inline" />);
    expect(screen.queryByRole("checkbox", { name: "Workload Kubernetes" })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Host / nó" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: "Mostrar infraestrutura" }));
    expect(screen.getByRole("checkbox", { name: "Workload Kubernetes" })).toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "Host / nó" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Mostrar infraestrutura" }));
    expect(screen.queryByRole("checkbox", { name: "Host / nó" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: "Mostrar infraestrutura" }));
    expect(screen.getByRole("checkbox", { name: "Host / nó" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Workload Kubernetes" })).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Recolher filtros" }));
    expect(screen.queryByRole("complementary", { name: "Filtros do mapa" })).not.toBeInTheDocument();
  });
});
