import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server.node";
import { createDOMRenderer, makeResetStyles, makeStyles, mergeClasses } from "@griffel/react";
import { rehydrateRendererCache } from "@griffel/core";
import type { ReactNode } from "react";
import { Providers } from "@/app/providers";

const mockInsertedHtmlCallbacks: Array<() => ReactNode> = [];

jest.mock("next/navigation", () => ({
  useServerInsertedHTML: (callback: () => ReactNode) => {
    mockInsertedHtmlCallbacks.push(callback);
  },
}));

const useReset = makeResetStyles({ padding: "4px", boxSizing: "border-box" });
const useStyles = makeStyles({
  root: { padding: "12px", color: "rgb(12, 34, 56)" },
  navigated: { backgroundColor: "rgb(65, 43, 21)" },
});

function StyleProbe({ navigated = false }: { navigated?: boolean }) {
  const reset = useReset();
  const styles = useStyles();
  return <div role="status" aria-label="Componente com estilos da aplicação" className={mergeClasses(reset, styles.root, navigated && styles.navigated)}>Estilos de teste</div>;
}

function flush(callback: () => ReactNode) {
  return renderToStaticMarkup(<>{callback()}</>);
}

function lastCallback() {
  const callback = mockInsertedHtmlCallbacks.at(-1);
  if (!callback) throw new Error("O registro SSR não instalou seu callback de estilos.");
  return callback;
}

function isolatedDocument(markup: string) {
  const target = document.implementation.createHTMLDocument("Reidratação Griffel");
  target.head.innerHTML = markup;
  return target;
}

describe("Providers: estilos Griffel no streaming do App Router", () => {
  beforeEach(() => {
    mockInsertedHtmlCallbacks.length = 0;
  });

  afterEach(() => {
    cleanup();
    document.head.querySelectorAll("[data-make-styles-bucket]").forEach((style) => style.remove());
    jest.restoreAllMocks();
  });

  test("emite o CSS real de reset e overrides uma única vez entre vários flushes", () => {
    render(<Providers><StyleProbe /></Providers>);
    const callback = lastCallback();
    const first = flush(callback);
    const second = flush(callback);
    const third = flush(callback);
    const target = isolatedDocument(first);
    const buckets = Array.from(target.head.querySelectorAll("style[data-make-styles-rehydration]"));

    expect(screen.getByRole("status", { name: "Componente com estilos da aplicação" })).toBeVisible();
    expect(buckets.length).toBeGreaterThan(0);
    expect(target.head.querySelector('[data-make-styles-bucket="r"]')?.textContent).toContain("4px");
    expect(target.head.querySelector('[data-make-styles-bucket="d"]')?.textContent).toContain("12px");
    expect(buckets.findIndex((style) => style.getAttribute("data-make-styles-bucket") === "r"))
      .toBeLessThan(buckets.findIndex((style) => style.getAttribute("data-make-styles-bucket") === "d"));
    expect(second).toBe("");
    expect(third).toBe("");
  });

  test("a concatenação dos flushes reidrata sem duplicação e mantém o cache para o cliente", () => {
    render(<Providers><StyleProbe /></Providers>);
    const callback = lastCallback();
    const target = isolatedDocument(flush(callback));
    target.body.innerHTML = flush(callback) + flush(callback);
    const clientRenderer = createDOMRenderer(target);
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    rehydrateRendererCache(clientRenderer, target);

    expect(target.body.querySelector("[data-make-styles-rehydration]")).toBeNull();
    expect(consoleError).not.toHaveBeenCalled();
  });

  test("um rerender preserva o registro enquanto estilos de cliente continuam disponíveis", () => {
    const view = render(<Providers><StyleProbe /></Providers>);
    const first = flush(lastCallback());
    expect(first).not.toBe("");

    view.rerender(<Providers><StyleProbe navigated /></Providers>);

    expect(flush(lastCallback())).toBe("");
    expect(screen.getByRole("status", { name: "Componente com estilos da aplicação" }))
      .toHaveStyle({ padding: "12px", backgroundColor: "rgb(65, 43, 21)" });
  });

  test("cada instância do provider emite seus estilos sem herdar o flag de outra instância", () => {
    const firstView = render(<Providers><StyleProbe /></Providers>);
    const firstCallback = lastCallback();
    expect(flush(firstCallback)).not.toBe("");
    firstView.unmount();

    render(<Providers><StyleProbe /></Providers>);
    const secondCallback = lastCallback();

    expect(flush(secondCallback)).not.toBe("");
    expect(flush(secondCallback)).toBe("");
    expect(flush(firstCallback)).toBe("");
  });
});
