import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SOURCE_ORDER, buildTheme } from "../scripts/lib/build.mjs";
import { checkCss, checkManifest, runChecks } from "../scripts/lib/check.mjs";

const strict = { allowFontPlaceholders: false };

test("checkCss reports !important, with or without a space", () => {
  assert.equal(checkCss("a{color:red!important}b{color:red ! important}", strict).length, 2);
});

test("checkCss ignores comments", () => {
  assert.deepEqual(checkCss("/* no !important, no url(https://x) */a{}", strict), []);
});

test("checkCss reports every non-data url() form", () => {
  const css = "a{b:url(http://x)}c{d:url('https://x')}e{f:URL( \"//cdn/x\" )}g{h:url(img.png)}";
  assert.equal(checkCss(css, strict).length, 4);
});

test("checkCss accepts data: URLs and, in src, font: placeholders", () => {
  assert.deepEqual(checkCss('a{b:url("data:font/woff2;base64,AA")}', strict), []);
  assert.deepEqual(checkCss('a{b:url("font:x.woff2")}', { allowFontPlaceholders: true }), []);
  assert.equal(checkCss('a{b:url("font:x.woff2")}', strict).length, 1);
});

test("checkCss reports @import", () => {
  assert.equal(checkCss('@import "x.css";', strict).length, 1);
});

test("checkManifest requires name Atrament, x.y.z version and minAppVersion", () => {
  assert.deepEqual(checkManifest({ name: "Atrament", version: "1.0.0", minAppVersion: "1.14.4" }), []);
  assert.equal(checkManifest({ name: "Other", version: "1.0" }).length, 3);
});

test("runChecks reports a stale or oversized theme.css and missing files", (t) => {
  const root = mkdtempSync(join(tmpdir(), "atrament-check-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "src"));
  mkdirSync(join(root, "fonts"));
  writeFileSync(join(root, "manifest.json"), JSON.stringify({ name: "Atrament", version: "1.0.0", minAppVersion: "1.14.4" }));
  writeFileSync(join(root, "fonts", "OFL.txt"), "licence");
  writeFileSync(join(root, "README.md"), "# Atrament\n");
  writeFileSync(join(root, "LICENSE"), "MIT\n");
  for (const f of SOURCE_ORDER) writeFileSync(join(root, "src", f), `/* ${f} */\n`);
  const built = buildTheme(root);
  writeFileSync(join(root, "theme.css"), built);

  assert.deepEqual(runChecks(root), ["missing file: screenshot.png"]);

  writeFileSync(join(root, "theme.css"), `${built}a{}\n`);
  assert.ok(runChecks(root).some((p) => p.includes("theme.css is out of date")));

  writeFileSync(join(root, "theme.css"), `${built}/*${"x".repeat(512000)}*/\n`);
  assert.ok(runChecks(root).some((p) => p.includes("theme.css is larger than 500 KB")));
});
