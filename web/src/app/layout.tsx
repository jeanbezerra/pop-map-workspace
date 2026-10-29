import type { Metadata } from "next";
import "@xyflow/react/dist/style.css";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Porto Observability Platform | Map",
  applicationName: "Porto Observability Platform",
  description: "Map da Porto Observability Platform: componentes, desempenho e resiliência para SRE e ERT. Prévia com dados fictícios.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body><Providers>{children}</Providers></body></html>;
}
