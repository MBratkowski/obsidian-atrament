import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";

export const THEME_FOLDER = "Atrament";
const THEME_FILES = ["manifest.json", "theme.css"];

export function resolveVault(argv, env, home) {
  const { values } = parseArgs({ args: argv, options: { vault: { type: "string" } }, strict: false });
  const raw = typeof values.vault === "string" ? values.vault : env.ATRAMENT_VAULT;
  if (!raw) return undefined;
  const expanded = raw === "~" ? home : raw.startsWith("~/") ? join(home, raw.slice(2)) : raw;
  return resolve(expanded);
}

export function installTheme(root, vault) {
  if (!existsSync(join(vault, ".obsidian"))) {
    throw new Error(`not an Obsidian vault: ${vault} has no .obsidian folder`);
  }
  const folder = join(vault, ".obsidian", "themes", THEME_FOLDER);
  // rmSync on a symlink removes the link itself, never its target.
  if (existsSync(folder) || isLink(folder)) rmSync(folder, { recursive: true, force: true });
  mkdirSync(folder, { recursive: true });
  for (const file of THEME_FILES) cpSync(join(root, file), join(folder, file));
  return folder;
}

function isLink(path) {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

export function themeVersion(root) {
  return JSON.parse(readFileSync(join(root, "manifest.json"), "utf8")).version;
}
