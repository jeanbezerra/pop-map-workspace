import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { MapWorkspace } from "@/features/map/map-workspace";
import type { MapComponent } from "@/features/map/model";

// Os testes exercitam o fluxo da aplicação; a geometria do canvas requer inspeção visual própria.
jest.mock("@/features/map/topology-canvas", () => ({
  TopologyCanvas: ({ components, onSelect }: { components: MapComponent[]; onSelect: (id: string) => void }) => (
    <section aria-label="Canvas de teste">{components.map((component) => <button key={component.id} onClick={() => onSelect(component.id)}>{component.name}</button>)}</section>
  ),
}));

function openWorkspace() {
  return render(<FluentProvider theme={webLightTheme}><MapWorkspace /></FluentProvider>);
}

describe("fluxo de revisão do POP Map", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-10-29T03:00:00.000Z"));
  });
  afterEach(() => jest.useRealTimers());

  test("URL inválida não inicia simulação e o erro fica associado ao campo", () => {
    openWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Nova busca" }));
    const dialog = screen.getByRole("dialog", { name: "Explore uma aplicação" });
    const field = within(dialog).getByLabelText(/URL da aplicação/);
    fireEvent.change(field, { target: { value: "javascript:alert(1)" } });
    fireEvent.submit(within(dialog).getByRole("button", { name: "Iniciar simulação" }).closest("form")!);
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(within(dialog).getByText(/Informe uma URL http ou https válida/)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Cancelar simulação" })).not.toBeInTheDocument();
    expect(localStorage.length).toBe(0);
  });

  test("a busca termina, sanitiza query strings e fica disponível no histórico local", async () => {
    openWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Nova busca" }));
    const dialog = screen.getByRole("dialog", { name: "Explore uma aplicação" });
    fireEvent.change(within(dialog).getByLabelText(/URL da aplicação/), { target: { value: "https://example.com/jornada?token=confidencial" } });
    fireEvent.submit(within(dialog).getByRole("button", { name: "Iniciar simulação" }).closest("form")!);
    expect(screen.getByRole("button", { name: "Cancelar simulação" })).toBeVisible();
    await act(async () => { jest.advanceTimersByTime(4600); });
    expect(screen.queryByRole("button", { name: "Cancelar simulação" })).not.toBeInTheDocument();
    expect(localStorage.getItem("pop-map:demo-sessions:v1")).not.toContain("confidencial");
    fireEvent.click(await screen.findByRole("button", { name: "Sessões neste navegador" }));
    expect(screen.getByText("example.com/jornada")).toBeVisible();
    expect(screen.getByText("Concluída")).toBeVisible();
  });

  test("cancelar encerra a simulação sem apagar o mapa conhecido nem completar depois", () => {
    openWorkspace();
    fireEvent.click(screen.getByRole("button", { name: "Simular atualização" }));
    act(() => jest.advanceTimersByTime(1200));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar simulação" }));
    act(() => jest.advanceTimersByTime(10000));
    expect(within(screen.getByRole("region", { name: "Canvas de teste" })).getByRole("button", { name: "Cotação auto" })).toBeVisible();
    const entries = JSON.parse(localStorage.getItem("pop-map:demo-sessions:v1")!);
    expect(entries).toHaveLength(1);
    expect(entries[0].outcome).toBe("cancelled");
  });

  test("a lista oferece ajuda contextual do mesmo tipo sem despachar requests", () => {
    const previousFetch = Object.getOwnPropertyDescriptor(globalThis, "fetch");
    const fetchMock = jest.fn();
    Object.defineProperty(globalThis, "fetch", { configurable: true, writable: true, value: fetchMock });
    try {
      openWorkspace();
      fireEvent.click(screen.getByRole("tab", { name: "Lista" }));
      fireEvent.click(screen.getByRole("button", { name: "Entender tipo Banco de dados" }));
      const help = screen.getByRole("dialog", { name: "Entenda o mapa" });
      expect(within(help).getByText(/Um endpoint lógico não descreve/)).toBeVisible();
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      if (previousFetch) Object.defineProperty(globalThis, "fetch", previousFetch);
      else Reflect.deleteProperty(globalThis, "fetch");
    }
  });
});
