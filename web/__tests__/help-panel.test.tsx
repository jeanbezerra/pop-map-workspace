import { fireEvent, render, screen, within } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { HelpPanel } from "@/features/map/help-panel";
import type { ComponentKind } from "@/features/map/model";

function renderHelp({
  open = true,
  initialKind,
  onOpenChange = jest.fn(),
}: {
  open?: boolean;
  initialKind?: ComponentKind;
  onOpenChange?: (open: boolean) => void;
} = {}) {
  return render(
    <FluentProvider theme={webLightTheme}>
      <HelpPanel open={open} initialKind={initialKind} onOpenChange={onOpenChange} />
    </FluentProvider>,
  );
}

describe("Ajuda contextual do mapa", () => {
  const originalFetch = globalThis.fetch;
  let fetchSpy: jest.Mock;

  beforeEach(() => {
    fetchSpy = jest.fn();
    globalThis.fetch = fetchSpy as typeof fetch;
  });

  afterEach(() => {
    expect(fetchSpy).not.toHaveBeenCalled();
    globalThis.fetch = originalFetch;
  });

  it("apresenta um diálogo nomeado com a descrição do tipo selecionado aberta", async () => {
    renderHelp({ initialKind: "DATABASE" });

    const dialog = await screen.findByRole("dialog", { name: "Entenda o mapa" });
    expect(within(dialog).getByText("Guia de leitura para SRE e ERT")).toBeVisible();
    expect(within(dialog).getByRole("button", { name: "Banco de dados" })).toHaveAttribute("aria-expanded", "true");
    expect(within(dialog).getByRole("button", { name: "Serviço" })).toHaveAttribute("aria-expanded", "false");
    expect(within(dialog).getByText("Base de cotações · PostgreSQL 18")).toBeVisible();
    expect(within(dialog).getByText(/Um endpoint lógico não descreve/)).toBeVisible();
  });

  it("filtra o catálogo local e explica uma busca sem resultados", async () => {
    renderHelp();
    const search = await screen.findByRole("textbox", { name: "Buscar tipo de componente" });

    fireEvent.change(search, { target: { value: "PostgreSQL" } });
    expect(screen.getByRole("button", { name: "Banco de dados" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Frontend" })).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: "componente-inexistente" } });
    expect(screen.getByRole("status")).toHaveTextContent("Nenhum tipo encontrado");

    fireEvent.change(search, { target: { value: "" } });
    expect(screen.getByRole("button", { name: "Frontend" })).toBeVisible();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("diferencia estados sem dados, dados antigos e hipótese de resiliência", async () => {
    renderHelp();
    fireEvent.click(await screen.findByRole("tab", { name: "Estados" }));

    const statesPanel = screen.getByRole("tabpanel", { name: "Estados" });
    expect(within(statesPanel).getByText("Sem dados")).toBeVisible();
    expect(within(statesPanel).getByText("Sem violação")).toBeVisible();
    expect(within(statesPanel).getByText("Desatualizado")).toBeVisible();
    expect(within(statesPanel).getByText("Inventário parcial não confirma SPOF")).toBeVisible();
    expect(within(statesPanel).getByText(/Não equivale a saudável nem a indisponível/)).toBeVisible();
  });

  it("explica a direção das chamadas e o limite da atribuição à rota", async () => {
    renderHelp();
    fireEvent.click(await screen.findByRole("tab", { name: "Conexões" }));

    const relationsPanel = screen.getByRole("tabpanel", { name: "Conexões" });
    expect(within(relationsPanel).getByText("Chamador")).toBeVisible();
    expect(within(relationsPanel).getByText("Chamado")).toBeVisible();
    expect(within(relationsPanel).getByText("Frontend não é o mesmo que rota")).toBeVisible();
    expect(within(relationsPanel).getByText(/A causa raiz exige análise adicional/)).toBeVisible();
  });

  it("permite fechar a ajuda por uma ação com nome acessível", async () => {
    const onOpenChange = jest.fn();
    renderHelp({ onOpenChange });

    fireEvent.click(await screen.findByRole("button", { name: "Fechar ajuda do mapa" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("não expõe um diálogo aberto quando a ajuda está fechada", () => {
    renderHelp({ open: false });
    expect(screen.queryByRole("dialog", { name: "Entenda o mapa" })).not.toBeInTheDocument();
  });
});
