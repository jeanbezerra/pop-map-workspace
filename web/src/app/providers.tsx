"use client";

import { useRef, useState, type ReactNode } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { createDOMRenderer, RendererProvider, renderToStyleElements } from "@griffel/react";
import { FluentProvider, SSRProvider, webLightTheme } from "@fluentui/react-components";

export function Providers({ children }: { children: ReactNode }) {
  const [renderer] = useState(() => createDOMRenderer());
  const stylesFlushed = useRef(false);

  useServerInsertedHTML(() => {
    // App Router pode chamar este callback várias vezes no mesmo stream.
    // renderToStyleElements retorna toda a folha, não somente regras novas.
    // https://griffel.js.org/react/guides/ssr-usage/#flush-the-styles-only-once
    if (stylesFlushed.current) return null;
    stylesFlushed.current = true;
    return <>{renderToStyleElements(renderer)}</>;
  });

  return (
    <RendererProvider renderer={renderer}>
      <SSRProvider>
        <FluentProvider theme={webLightTheme} style={{ minHeight: "100dvh" }}>
          {children}
        </FluentProvider>
      </SSRProvider>
    </RendererProvider>
  );
}
