import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { resolve } from "node:path";

const server = resolve("dist/react-ssr-corp-srep-pop-map/standalone/server.js");
try {
  await access(server);
} catch {
  console.error("Build não encontrado. Execute npm run build antes de npm start.");
  process.exit(1);
}
const child = spawn(process.execPath, [server], {
  stdio: "inherit",
  env: { ...process.env, HOSTNAME: process.env.HOSTNAME ?? "0.0.0.0", PORT: process.env.PORT ?? "3000" },
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 1; });
