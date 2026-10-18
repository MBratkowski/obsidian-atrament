import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { buildTheme } from "./build.mjs";

export const MAX_THEME_BYTES = 512000;
export const REQUIRED_FILES = ["README.md", "LICENSE", "screenshot.png", "fonts/OFL.txt", "manifest.json", "theme.css"];

export function checkCss(css, { allowFontPlaceholders }) {
  const problems = [];
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const important = text.match(/!\s*important/gi) ?? [];
  for (let i = 0; i < important.length; i++) problems.push("!important is not allowed");
  for (const _ of text.matchAll(/@import\b/gi)) problems.push("@import is not allowed");
  for (const m of text.matchAll(/url\(\s*/gi)) {
    const start = m.index + m[0].length;
    const quote = text[start] === '"' || text[start] === "'" ? text[start] : "";
    let target;
    let closed = false;
    if (quote) {
      const end = text.indexOf(quote, start + 1);
      if (end !== -1) {
        target = text.slice(start + 1, end);
        closed = /^\s*\)/.test(text.slice(end + 1));
      }
    } else {
      const end = text.indexOf(")", start);
      if (end !== -1) {
        target = text.slice(start, end).trim();
        closed = true;
      }
    }
    if (closed && /^data:/i.test(target)) continue;
    if (closed && allowFontPlaceholders && /^font:/i.test(target)) continue;
    problems.push(closed ? `url() must be a data: URL, found url(${target})` : "url() is malformed or unclosed");
  }
  return problems;
}

export function checkManifest(manifest) {
  const problems = [];
  if (manifest.name !== "Atrament") problems.push('manifest.json: name must be "Atrament"');
  if (typeof manifest.version !== "string" || !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    problems.push("manifest.json: version must be in x.y.z form");
  }
  if (typeof manifest.minAppVersion !== "string" || manifest.minAppVersion === "") {
    problems.push("manifest.json: minAppVersion is required");
  }
  return problems;
}

export function checkFiles(root) {
  return REQUIRED_FILES.filter((f) => !existsSync(join(root, f))).map((f) => `missing file: ${f}`);
}

export function runChecks(root) {
  const problems = checkFiles(root);

  const manifestPath = join(root, "manifest.json");
  if (existsSync(manifestPath)) {
    try {
      problems.push(...checkManifest(JSON.parse(readFileSync(manifestPath, "utf8"))));
    } catch (error) {
      problems.push(`manifest.json: ${error.message}`);
    }
  }

  const srcDir = join(root, "src");
  if (existsSync(srcDir)) {
    for (const file of readdirSync(srcDir).filter((f) => f.endsWith(".css")).sort()) {
      const css = readFileSync(join(srcDir, file), "utf8");
      problems.push(...checkCss(css, { allowFontPlaceholders: true }).map((p) => `src/${file}: ${p}`));
    }
  }

  const themePath = join(root, "theme.css");
  if (existsSync(themePath)) {
    const theme = readFileSync(themePath, "utf8");
    problems.push(...checkCss(theme, { allowFontPlaceholders: false }).map((p) => `theme.css: ${p}`));
    if (statSync(themePath).size > MAX_THEME_BYTES) problems.push("theme.css is larger than 500 KB");
    try {
      if (buildTheme(root) !== theme) problems.push("theme.css is out of date, run pnpm build");
    } catch (error) {
      problems.push(`theme.css cannot be rebuilt: ${error.message}`);
    }
  }
  return problems;
}
