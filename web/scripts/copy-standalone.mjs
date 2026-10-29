import { cp, access, mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";

const dist = resolve("dist/react-ssr-corp-srep-pop-map");
const standalone = join(dist, "standalone");
await access(join(standalone, "server.js"));
await mkdir(join(standalone, "public"), { recursive: true });
await cp(resolve("public"), join(standalone, "public"), { recursive: true });
await mkdir(join(standalone, "dist/react-ssr-corp-srep-pop-map"), { recursive: true });
await cp(join(dist, "static"), join(standalone, "dist/react-ssr-corp-srep-pop-map/static"), { recursive: true });
console.log("Standalone pronto: public e static copiados para o layout de runtime.");
