import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, symlinkSync, lstatSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveVault, installTheme } from "../scripts/lib/vault-install.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), "atrament-vault-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test("resolveVault takes --vault first, then ATRAMENT_VAULT, and expands ~", () => {
  assert.equal(resolveVault(["--vault", "~/Obsidian/Personal Life"], {}, "/Users/me"), "/Users/me/Obsidian/Personal Life");
  assert.equal(resolveVault(["--vault=~/V"], { ATRAMENT_VAULT: "/other" }, "/Users/me"), "/Users/me/V");
  assert.equal(resolveVault(["--vault", "~"], {}, "/Users/me"), "/Users/me");
  assert.equal(resolveVault([], { ATRAMENT_VAULT: "~/V" }, "/Users/me"), "/Users/me/V");
  assert.equal(resolveVault([], {}, "/Users/me"), undefined);
});

test("installTheme copies manifest.json and theme.css into .obsidian/themes/Atrament", (t) => {
  const vault = tempDir(t);
  const target = join(vault, ".obsidian", "themes", "Atrament");
  mkdirSync(target, { recursive: true });
  writeFileSync(join(target, "theme.css"), "old");
  const folder = installTheme(root, vault);
  assert.equal(folder, target);
  assert.ok(lstatSync(target).isDirectory());
  for (const f of ["manifest.json", "theme.css"]) {
    assert.equal(readFileSync(join(target, f), "utf8"), readFileSync(join(root, f), "utf8"));
  }
});

test("installTheme replaces a symlinked theme folder with real files", (t) => {
  const vault = tempDir(t);
  const elsewhere = tempDir(t);
  writeFileSync(join(elsewhere, "theme.css"), "keep");
  mkdirSync(join(vault, ".obsidian", "themes"), { recursive: true });
  const target = join(vault, ".obsidian", "themes", "Atrament");
  symlinkSync(elsewhere, target);
  installTheme(root, vault);
  assert.equal(lstatSync(target).isSymbolicLink(), false);
  assert.equal(readFileSync(join(target, "theme.css"), "utf8"), readFileSync(join(root, "theme.css"), "utf8"));
  assert.equal(readFileSync(join(elsewhere, "theme.css"), "utf8"), "keep");
});

test("installTheme refuses a folder without .obsidian", (t) => {
  const empty = tempDir(t);
  assert.throws(() => installTheme(root, empty), /not an Obsidian vault/);
});
