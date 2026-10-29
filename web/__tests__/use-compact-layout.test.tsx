import { act, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server.node";
import { useCompactLayout } from "@/features/map/use-compact-layout";

function LayoutProbe() {
  return <output aria-label="Apresentação dos filtros">{useCompactLayout() ? "Drawer" : "Painel lateral"}</output>;
}

describe("Apresentação responsiva dos filtros", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => { window.matchMedia = originalMatchMedia; });

  test("renderização no servidor não depende de APIs do navegador", () => {
    const matchMedia = jest.fn(() => { throw new Error("matchMedia não está disponível no servidor"); });
    window.matchMedia = matchMedia;

    expect(renderToStaticMarkup(<LayoutProbe />)).toContain("Painel lateral");
    expect(matchMedia).not.toHaveBeenCalled();
  });

  test("acompanha mudanças de tamanho e remove a assinatura ao desmontar", () => {
    let compact = false;
    const listeners = new Set<() => void>();
    const media = {
      get matches() { return compact; },
      addEventListener: jest.fn((_event: string, listener: () => void) => listeners.add(listener)),
      removeEventListener: jest.fn((_event: string, listener: () => void) => listeners.delete(listener)),
    } as unknown as MediaQueryList;
    window.matchMedia = jest.fn(() => media);

    const { unmount } = render(<LayoutProbe />);
    expect(screen.getByRole("status", { name: "Apresentação dos filtros" })).toHaveTextContent("Painel lateral");

    act(() => { compact = true; listeners.forEach((listener) => listener()); });
    expect(screen.getByRole("status", { name: "Apresentação dos filtros" })).toHaveTextContent("Drawer");

    act(() => { compact = false; listeners.forEach((listener) => listener()); });
    expect(screen.getByRole("status", { name: "Apresentação dos filtros" })).toHaveTextContent("Painel lateral");

    unmount();
    expect(listeners.size).toBe(0);
    expect(media.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });
});
