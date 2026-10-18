import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SOURCE_ORDER, inlineFonts, buildTheme } from "../scripts/lib/build.mjs";

test("inlineFonts replaces each font: placeholder with a woff2 data URL", () => {
  const css = 'a{src:url("font:x.woff2")}b{src:url(font:y.woff2)}';
  const out = inlineFonts(css, (name) => Buffer.from(name));
  assert.equal(out, `a{src:url("data:font/woff2;base64,${Buffer.from("x.woff2").toString("base64")}")}b{src:url("data:font/woff2;base64,${Buffer.from("y.woff2").toString("base64")}")}`);
});

test("inlineFonts names the missing font file", () => {
  assert.throws(
    () => inlineFonts('url("font:gone.woff2")', () => { throw Object.assign(new Error("x"), { code: "ENOENT" }); }),
    /font file not found: fonts\/gone\.woff2/,
  );
});

test("buildTheme concatenates src in SOURCE_ORDER under a versioned header", () => {
  const root = mkdtempSync(join(tmpdir(), "atrament-"));
  mkdirSync(join(root, "src"));
  mkdirSync(join(root, "fonts"));
  writeFileSync(join(root, "manifest.json"), JSON.stringify({ name: "Atrament", version: "9.9.9" }));
  writeFileSync(join(root, "fonts", "a.woff2"), "font-bytes");
  for (const f of SOURCE_ORDER) {
    const extra = f === "fonts.css" ? '@font-face{src:url("font:a.woff2")}' : "";
    writeFileSync(join(root, "src", f), `/* ${f} */\n${extra}\n`);
  }
  const css = buildTheme(root);
  assert.match(css, /^\/\* Atrament 9\.9\.9/);
  const positions = SOURCE_ORDER.map((f) => css.indexOf(`/* ${f} */`));
  assert.ok(positions.every((p) => p >= 0));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.ok(!css.includes("font:"));
  assert.ok(css.includes(Buffer.from("font-bytes").toString("base64")));
});
