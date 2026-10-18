import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { installTheme, resolveVault, themeVersion } from "./lib/vault-install.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const vault = resolveVault(process.argv.slice(2), process.env, homedir());
if (!vault) {
  console.error("Usage: pnpm vault:install --vault <path>  (or set ATRAMENT_VAULT)");
  process.exit(1);
}
try {
  const folder = installTheme(root, vault);
  console.log(`installed Atrament ${themeVersion(root)} into ${folder}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
