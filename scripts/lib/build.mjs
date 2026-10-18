import { readFileSync } from "node:fs";
import { join } from "node:path";

export const SOURCE_ORDER = [
  "fonts.css",
  "tokens.css",
  "typography.css",
  "editor.css",
  "interface.css",
  "plugins.css",
];

const FONT_PLACEHOLDER = /url\(\s*(["']?)font:([^"')\s]+)\1\s*\)/g;

/** Replace every url(font:<file>) placeholder with a base64 woff2 data URL. */
export function inlineFonts(css, readFont) {
  return css.replace(FONT_PLACEHOLDER, (_, _quote, name) => {
    let bytes;
    try {
      bytes = readFont(name);
    } catch (error) {
      if (error.code === "ENOENT") throw new Error(`font file not found: fonts/${name}`);
      throw error;
    }
    return `url("data:font/woff2;base64,${bytes.toString("base64")}")`;
  });
}

/** Build the full theme.css text from src/ and fonts/ under root. */
export function buildTheme(root) {
  const { version } = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
  // The font licence notice travels with theme.css, the only file users receive (OFL section 2).
  const header =
    `/* Atrament ${version} — https://github.com/MBratkowski/obsidian-atrament. Built from src/; do not edit. ` +
    "Albert Sans, Copyright 2021 The Albert Sans Project Authors (https://github.com/usted/Albert-Sans), " +
    "licensed under the SIL Open Font License 1.1 (https://openfontlicense.org). */\n";
  const body = SOURCE_ORDER.map((file) => readFileSync(join(root, "src", file), "utf8")).join("\n");
  return header + inlineFonts(body, (name) => readFileSync(join(root, "fonts", name)));
}
