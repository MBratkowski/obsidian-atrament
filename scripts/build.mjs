import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildTheme } from "./lib/build.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const css = buildTheme(root);
writeFileSync(join(root, "theme.css"), css);
console.log(`theme.css written, ${(Buffer.byteLength(css) / 1024).toFixed(1)} KB`);
