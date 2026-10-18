# Atrament Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, verify, install and release Atrament, an Obsidian theme in the style of the blog's "Minimum" design.

**Architecture:** CSS sources in `src/` override Obsidian's CSS variables (selectors only where no variable exists). A dependency-free Node build concatenates them and inlines the Albert Sans woff2 files as data URLs into `theme.css`. Small Node modules in `scripts/lib/` (build, check, vault install) carry the logic and have `node:test` tests; thin CLIs in `scripts/` call them.

**Tech Stack:** CSS custom properties, Node 24 ESM (`node:fs`, `node:path`, `node:test`), pnpm 11, Obsidian 1.14.4 and its CLI (`obsidian`), ImageMagick (`magick`), GitHub Actions, `gh`.

**Spec:** `docs/superpowers/specs/2026-10-18-atrament-theme-design.md`

## Global Constraints

- Theme name `Atrament`; theme folder in a vault `.obsidian/themes/Atrament/`; repository `MBratkowski/obsidian-atrament`, public.
- `manifest.json`: `"name": "Atrament"`, `"version": "1.0.0"`, `"minAppVersion": "1.14.4"`, `"author": "Mateusz Bratkowski"`, `"authorUrl": "https://github.com/MBratkowski"`.
- No `!important`, no `@import`, no `url()` other than `data:` in `theme.css` (in `src/` the `font:` placeholder is also allowed).
- `theme.css` at most 500 KB (512000 bytes).
- Variables of the theme's own palette are named `--atrament-*`.
- General values go on `body`; colours on `.theme-light` and `.theme-dark`. Selectors short and low in specificity.
- The theme never sets the base font size and ignores Obsidian's accent colour setting (accent is ink).
- No npm dependencies; `package.json` has scripts only.
- Everything in English (code, comments, docs, commits); the sample note may quote Polish text as test glyphs.
- Each step that leaves the machine (create the GitHub repo, push, merge, tag, publish a release) and each change to the author's vault settings waits for the author's go-ahead at that moment.
- Implementation happens on branch `feat/atrament-1.0`; `main` holds only the spec and this plan until the pull request is merged.

## Review Focus

1. Vault path with `~` and spaces (`~/Obsidian/Personal Life`, from `--vault` or `ATRAMENT_VAULT`) → resolved to the absolute path, not treated as a relative folder named `~`. Test in Task 3.
2. The target theme folder already exists, as an old copy or as a symbolic link → replaced by a real folder with real files (Obsidian Sync skips symlinks). Test in Task 3.
3. `url()` written as `url(x)`, `url('x')`, `URL( "x" )`, or protocol-relative `//cdn/x` → all reported unless they are `data:` (or `font:` in `src/`). Test in Task 2.
4. A comment that mentions `!important` or `url(https://…)` → not reported; `! important` with a space → reported. Test in Task 2.
5. A `font:` placeholder whose file is missing in `fonts/` → the build fails naming the file, instead of shipping an unresolved URL. Test in Task 1.

---

### Task 1: Scaffold and build script

**Files:**
- Create: `package.json`, `.gitignore`, `manifest.json`, `fonts/albert-sans-latin.woff2`, `fonts/albert-sans-latin-ext.woff2`, `fonts/albert-sans-italic-latin.woff2`, `fonts/albert-sans-italic-latin-ext.woff2`, `fonts/OFL.txt`
- Create: `src/fonts.css`, `src/tokens.css`, `src/typography.css`, `src/editor.css`, `src/interface.css`, `src/plugins.css` (all but `fonts.css` hold only a one-line header comment for now)
- Create: `scripts/lib/build.mjs`, `scripts/build.mjs`
- Test: `tests/build.test.mjs`

**Interfaces:**
- Produces: `SOURCE_ORDER: string[]` = `["fonts.css", "tokens.css", "typography.css", "editor.css", "interface.css", "plugins.css"]`; `inlineFonts(css: string, readFont: (name: string) => Buffer): string`; `buildTheme(root: string): string` (returns the full `theme.css` text, does not write).

- [ ] **Step 1: Branch and scaffold**

`git switch -c feat/atrament-1.0`. `package.json`: `"name": "obsidian-atrament"`, `"private": true`, `"type": "module"`, `"packageManager": "pnpm@11.10.0"`, `"engines": {"node": ">=24"}`, scripts `build` (`node scripts/build.mjs`), `check` (`node scripts/check.mjs`), `test` (`node --test tests/`), `vault:install` (`node scripts/vault-install.mjs`). `.gitignore`: `node_modules/`, `.DS_Store`, `sample-vault/.obsidian/`. `manifest.json` with the values from Global Constraints. Fonts: fetch `https://fonts.googleapis.com/css2?family=Albert+Sans:ital,wght@0,400..600;1,400..600` with a desktop Chrome user agent into an empty scratch folder, download the four latin and latin-ext woff2 URLs it lists, copy them to the four `fonts/` names above (each 23–35 KB). `fonts/OFL.txt` is a copy of `~/Projects/web/apps/blog/src/assets/albert-sans-OFL.txt`.

`src/fonts.css`: four `@font-face` rules, `font-family: "Albert Sans"`, `font-weight: 400 600`, `font-style` normal or italic, `src: url("font:<file>") format("woff2")`, and the `unicode-range` Google lists for each subset.

- [ ] **Step 2: Write the failing tests**

```js
test("inlineFonts replaces each font: placeholder with a woff2 data URL", () => {
  const css = 'a{src:url("font:x.woff2")}b{src:url(font:y.woff2)}';
  const out = inlineFonts(css, (name) => Buffer.from(name));
  assert.equal(out, `a{src:url("data:font/woff2;base64,${Buffer.from("x.woff2").toString("base64")}")}b{src:url("data:font/woff2;base64,${Buffer.from("y.woff2").toString("base64")}")}`);
});
test("inlineFonts names the missing font file", () => {
  assert.throws(() => inlineFonts('url("font:gone.woff2")', () => { throw Object.assign(new Error("x"), { code: "ENOENT" }); }), /font file not found: fonts\/gone\.woff2/);
});
test("buildTheme concatenates src in SOURCE_ORDER under a versioned header", () => {
  // temp root with manifest {name:"Atrament",version:"9.9.9"}, fonts/a.woff2, and each SOURCE_ORDER file containing "/* <name> */"
  const css = buildTheme(root);
  assert.match(css, /^\/\* Atrament 9\.9\.9/);
  const positions = SOURCE_ORDER.map((f) => css.indexOf(`/* ${f} */`));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.ok(!css.includes("font:"));
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test`
Expected: FAIL, `Cannot find module '../scripts/lib/build.mjs'`.

- [ ] **Step 4: Implement `scripts/lib/build.mjs` and `scripts/build.mjs`**

Placeholder pattern: `url(` + optional quote + `font:` + file name + matching quote + `)`. The header is `/* Atrament <version> — https://github.com/MBratkowski/obsidian-atrament. Built from src/; do not edit. Albert Sans: SIL Open Font License 1.1, see fonts/OFL.txt. */`. `scripts/build.mjs` writes `buildTheme(repoRoot)` to `theme.css` and prints its size in KB.

- [ ] **Step 5: Run tests and build**

Run: `pnpm test && pnpm build`
Expected: tests PASS; `theme.css` written, about 155 KB.

- [ ] **Step 6: Commit**

`git add -A && git commit -m "feat: build theme.css from src with embedded Albert Sans"`

---

### Task 2: Check script

**Files:**
- Create: `scripts/lib/check.mjs`, `scripts/check.mjs`, `README.md` (title and one paragraph for now), `LICENSE` (MIT, "Copyright (c) 2026 Mateusz Bratkowski")
- Test: `tests/check.test.mjs`

**Interfaces:**
- Consumes: `buildTheme(root)` from Task 1.
- Produces: `checkCss(css: string, { allowFontPlaceholders: boolean }): string[]`; `checkManifest(manifest: object): string[]`; `checkFiles(root: string): string[]`; `runChecks(root: string): string[]`. Each returns human-readable problems, empty when fine.

- [ ] **Step 1: Write the failing tests**

```js
test("checkCss reports !important, with or without a space", () => {
  assert.equal(checkCss("a{color:red!important}b{color:red ! important}", { allowFontPlaceholders: false }).length, 2);
});
test("checkCss ignores comments", () => {
  assert.deepEqual(checkCss("/* no !important, no url(https://x) */a{}", { allowFontPlaceholders: false }), []);
});
test("checkCss reports every non-data url() form", () => {
  const css = "a{b:url(http://x)}c{d:url('https://x')}e{f:URL( \"//cdn/x\" )}g{h:url(img.png)}";
  assert.equal(checkCss(css, { allowFontPlaceholders: false }).length, 4);
});
test("checkCss accepts data: URLs and, in src, font: placeholders", () => {
  assert.deepEqual(checkCss('a{b:url("data:font/woff2;base64,AA")}', { allowFontPlaceholders: false }), []);
  assert.deepEqual(checkCss('a{b:url("font:x.woff2")}', { allowFontPlaceholders: true }), []);
  assert.equal(checkCss('a{b:url("font:x.woff2")}', { allowFontPlaceholders: false }).length, 1);
});
test("checkCss reports @import", () => {
  assert.equal(checkCss('@import "x.css";', { allowFontPlaceholders: false }).length, 1);
});
test("checkManifest requires name Atrament, x.y.z version and minAppVersion", () => {
  assert.deepEqual(checkManifest({ name: "Atrament", version: "1.0.0", minAppVersion: "1.14.4" }), []);
  assert.equal(checkManifest({ name: "Other", version: "1.0", }).length, 3);
});
test("runChecks reports a stale or oversized theme.css and missing files", () => {
  // temp root built by buildTheme, then theme.css edited → problem mentioning "theme.css is out of date"; screenshot.png absent → "missing file: screenshot.png"; theme.css > 512000 bytes → "theme.css is larger than 500 KB"
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test`
Expected: FAIL, `Cannot find module '../scripts/lib/check.mjs'`.

- [ ] **Step 3: Implement `scripts/lib/check.mjs` and `scripts/check.mjs`**

Strip `/* … */` comments before matching. Required files: `README.md`, `LICENSE`, `screenshot.png`, `fonts/OFL.txt`, `manifest.json`, `theme.css`. `runChecks` applies `checkCss` to each `src/*.css` with placeholders allowed and to `theme.css` without. The CLI prints each problem on its own line and exits 1 when there is any, else prints `check: ok`.

- [ ] **Step 4: Run tests and the check**

Run: `pnpm test && pnpm check`
Expected: tests PASS; `pnpm check` exits 1 with exactly one problem, `missing file: screenshot.png` (it appears in Task 10).

- [ ] **Step 5: Commit**

`git add -A && git commit -m "feat: check theme rules, manifest and required files"`

---

### Task 3: Vault install script

**Files:**
- Create: `scripts/lib/vault-install.mjs`, `scripts/vault-install.mjs`
- Test: `tests/vault-install.test.mjs`

**Interfaces:**
- Produces: `resolveVault(argv: string[], env: Record<string, string | undefined>, home: string): string | undefined` (absolute path); `installTheme(root: string, vault: string): string` (returns the theme folder it wrote; throws `Error("not an Obsidian vault: <vault> has no .obsidian folder")`).

- [ ] **Step 1: Write the failing tests**

```js
test("resolveVault takes --vault first, then ATRAMENT_VAULT, and expands ~", () => {
  assert.equal(resolveVault(["--vault", "~/Obsidian/Personal Life"], {}, "/Users/me"), "/Users/me/Obsidian/Personal Life");
  assert.equal(resolveVault([], { ATRAMENT_VAULT: "~/V" }, "/Users/me"), "/Users/me/V");
  assert.equal(resolveVault([], {}, "/Users/me"), undefined);
});
test("installTheme copies manifest.json and theme.css into .obsidian/themes/Atrament", () => {
  // temp vault with .obsidian/themes/Atrament/theme.css containing "old" → after install both files equal the repo's, target is a real directory
});
test("installTheme replaces a symlinked theme folder with real files", () => {
  // .obsidian/themes/Atrament is a symlink to another temp dir → after install lstat(...).isSymbolicLink() is false, the link's old target is untouched
});
test("installTheme refuses a folder without .obsidian", () => {
  assert.throws(() => installTheme(root, emptyDir), /not an Obsidian vault/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test`
Expected: FAIL, `Cannot find module '../scripts/lib/vault-install.mjs'`.

- [ ] **Step 3: Implement `scripts/lib/vault-install.mjs` and `scripts/vault-install.mjs`**

A symlink at the target is removed with `fs.rmSync` on the link itself (never its target), then the folder is created. The CLI prints usage `Usage: pnpm vault:install --vault <path>  (or set ATRAMENT_VAULT)` and exits 1 when no vault is given; otherwise prints `installed Atrament <version> into <folder>`.

- [ ] **Step 4: Run tests**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

`git add -A && git commit -m "feat: install the theme into a vault as real files"`

---

### Task 4: Sample vault opened in Obsidian

**Files:**
- Create: `sample-vault/Showcase.md`, `sample-vault/Embedded note.md`, `sample-vault/cover.png`

**Interfaces:**
- Produces: a vault named `sample-vault` known to Obsidian, with Atrament active; later tasks call `obsidian vault=sample-vault …`.

- [ ] **Step 1: Write the sample notes**

`Showcase.md` has frontmatter (`tags`, `date`, `description`), then in order: H1–H6; a paragraph with **bold**, *italic*, ==highlight==, an internal link to `Embedded note`, an unresolved link, an external link and a footnote; the line `Polish glyphs: Zażółć gęślą jaźń. ZAŻÓŁĆ GĘŚLĄ JAŹŃ.`; a `>` quote of two sentences; bulleted and numbered lists; a task list with one done task; `#tag` and `#nested/tag`; inline code; a `js` and a `css` code block; one callout of each family (`note`, `tip`, `question`, `warning`, `danger`, and a custom `[!custom]`); a three-column table; a horizontal rule; `![[cover.png]]`; `![[Embedded note]]`; the footnote text. `Embedded note.md` holds two short paragraphs. `cover.png`: `magick -size 1200x630 xc:'#e9e1d6' sample-vault/cover.png`.

- [ ] **Step 2: Install the theme and configure the sample vault**

Run: `pnpm build && mkdir -p sample-vault/.obsidian && pnpm vault:install --vault sample-vault`, then write `sample-vault/.obsidian/appearance.json` as `{"cssTheme": "Atrament", "theme": "moonstone", "baseFontSize": 18}`.
Expected: `installed Atrament 1.0.0 into …/sample-vault/.obsidian/themes/Atrament`.

- [ ] **Step 3: Open it in Obsidian**

Run: `obsidian eval code="require('electron').ipcRenderer.sendSync('vault-open', '<absolute path>/sample-vault', true)"`, then `obsidian vaults`.
Expected: `sample-vault` is listed. If not, ask the author to open the folder once with "Open folder as vault", then re-run `obsidian vaults`.

- [ ] **Step 4: Confirm the theme and the font load**

Run: `obsidian vault=sample-vault theme` and `obsidian vault=sample-vault eval code="document.fonts.check('500 18px \"Albert Sans\"')"`
Expected: `Atrament`; `=> true`.

- [ ] **Step 5: Commit**

`git add sample-vault && git commit -m "test: add a sample vault that shows every styled element"`

---

### Visual check routine (used by Tasks 5–7 and 9)

After each `pnpm build && pnpm vault:install --vault sample-vault`, Obsidian reloads the theme on file change (otherwise `obsidian vault=sample-vault reload`). Then, with `Showcase.md` open (`obsidian vault=sample-vault open file=Showcase`):

1. Viewport 1280×720: `obsidian vault=sample-vault dev:cdp method=Emulation.setDeviceMetricsOverride params='{"width":1280,"height":720,"deviceScaleFactor":1,"mobile":false}'`.
2. Light: `obsidian vault=sample-vault eval code="app.changeTheme('moonstone')"`; `dev:screenshot path=<scratchpad>/<task>-light.png`. Dark: `app.changeTheme('obsidian')`; `<task>-dark.png`. Repeat in reading view.
3. Phone: `obsidian vault=sample-vault dev:mobile on`, viewport 375×812, both modes; then `dev:mobile off` and `Emulation.clearDeviceMetricsOverride`.
4. `obsidian vault=sample-vault dev:errors` shows nothing from the theme.
5. Look at the screenshots next to `https://blog.mbratkowski.workers.dev/posts/pl/wroclaw-synekdocha-iii-rp/` in the built-in browser at the same width, light and dark.

---

### Task 5: Palette, fonts and typography

**Files:**
- Modify: `src/tokens.css`, `src/typography.css`

**Interfaces:**
- Produces: `--atrament-bg`, `--atrament-ink`, `--atrament-body`, `--atrament-muted`, `--atrament-faint`, `--atrament-surface`, `--atrament-line`, `--atrament-underline`, `--atrament-mark`, `--atrament-cover-{sand,steel,sage,blush,lilac,neutral}`, `--atrament-shadow`, defined on `.theme-light` and `.theme-dark`; every later task uses only these for colour.

- [ ] **Step 1: `src/tokens.css`**

Header comment naming the blog sources (`src/styles/global.css`, `tailwind.config.ts`, `src/site.config.ts` in MBratkowski/blog). Palette values: the spec's "Palette" table; `--atrament-shadow: 0 12px 32px rgb(0 0 0 / 0.14)`. Syntax colours as `--atrament-code-*`:

| Role | github-light | github-dark | Obsidian variables |
|---|---|---|---|
| comment | #6a737d | #6a737d | `--code-comment` |
| keyword | #d73a49 | #f97583 | `--code-keyword`, `--code-operator` |
| string | #032f62 | #9ecbff | `--code-string` |
| function | #6f42c1 | #b392f0 | `--code-function` |
| constant | #005cc5 | #79b8ff | `--code-value`, `--code-property` |
| tag | #22863a | #85e89d | `--code-tag` |
| variable | #e36209 | #ffab70 | `--code-important` |
| text | `--atrament-body` | `--atrament-body` | `--code-normal`, `--code-punctuation` |

Mapping, on `.theme-light, .theme-dark`:

| Obsidian variables | Value |
|---|---|
| `--background-primary`, `--background-secondary`, `--background-secondary-alt`, `--background-modifier-form-field`, `--interactive-normal`, `--ribbon-background`, `--ribbon-background-collapsed`, `--status-bar-background`, `--titlebar-background`, `--titlebar-background-focused`, `--tab-container-background`, `--modal-background`, `--menu-background`, `--prompt-background` | bg |
| `--background-primary-alt`, `--background-modifier-hover`, `--background-modifier-active-hover`, `--interactive-hover`, `--nav-item-background-hover`, `--nav-item-background-active`, `--nav-item-background-selected`, `--tab-background-active`, `--code-background`, `--tag-background-hover` | surface |
| `--background-modifier-border`, `--divider-color`, `--table-border-color`, `--table-header-border-color`, `--hr-color`, `--tag-border-color`, `--modal-border-color`, `--menu-border-color`, `--prompt-border-color`, `--input-unfocused-border-color`, `--graph-line` | line |
| `--background-modifier-border-hover`, `--input-hover-border-color`, `--checkbox-border-color`, `--tag-border-color-hover`, `--link-unresolved-decoration-color` | underline |
| `--text-normal`, `--graph-text`, `--metadata-input-text-color`, `--interactive-accent-hover`, `--checkbox-color-hover` | body |
| `--text-muted`, `--h5-color`, `--h6-color`, `--table-header-color`, `--metadata-label-text-color`, `--tab-text-color`, `--graph-node` | muted |
| `--text-faint`, `--link-unresolved-color`, `--checklist-done-color`, `--graph-node-tag`, `--graph-node-attachment`, `--graph-node-unresolved` | faint |
| `--text-accent`, `--text-accent-hover`, `--color-accent`, `--color-accent-1`, `--color-accent-2`, `--interactive-accent`, `--h1-color`…`--h4-color`, `--bold-color`, `--blockquote-color`, `--link-color`, `--link-color-hover`, `--link-external-color`, `--link-external-color-hover`, `--tag-color`, `--tag-color-hover`, `--nav-item-color-active`, `--tab-text-color-focused-active`, `--tab-text-color-focused-active-current`, `--checkbox-color`, `--background-modifier-border-focus`, `--input-focus-border-color`, `--graph-node-focused`, `--callout-default`, `--callout-info`, `--callout-todo`, `--callout-important`, `--callout-tip`, `--callout-success`, `--callout-question`, `--callout-warning`, `--callout-fail`, `--callout-error`, `--callout-bug`, `--callout-example`, `--callout-quote`, `--callout-summary` | ink |
| `--text-on-accent`, `--checkbox-marker-color` | bg |
| `--text-selection`, `--highlight-background` | mark |
| `--shadow-l`, `--modal-shadow`, `--menu-shadow` | `var(--atrament-shadow)` |
| `--color-accent-hsl` | `0, 0%, 5%` (light), `0, 0%, 95%` (dark) |
| `--tag-background`, `--blockquote-background-color` | `transparent` |

`body`: `--font-text-theme` and `--font-interface-theme` `"Albert Sans", system-ui, sans-serif`; `--font-monospace-theme` the blog stack from the spec.

- [ ] **Step 2: `src/typography.css`**

`body`: `--line-height-normal: 1.7`, `--p-spacing: 1.2em`, `--file-line-width: 700px`, `--bold-weight: 600`, `--inline-title-size: 2.5em`, `--inline-title-weight: 500`, `--inline-title-line-height: 1.04`, heading sizes, line heights and `--hN-weight: 500`, `--hN-letter-spacing: -0.02em` per the spec's heading table, `--blockquote-border-thickness: 0`, `--blockquote-font-style: normal`. Selectors: `.inline-title { letter-spacing: -0.04em }`; `.markdown-rendered blockquote, .markdown-source-view.mod-cm6 .HyperMD-quote { font-size: 1.35em; font-weight: 500; line-height: 1.3; letter-spacing: -0.02em }`, and in Live Preview hide the quote's left bar if `--blockquote-border-thickness: 0` leaves it visible (inspect with `dev:css selector=".HyperMD-quote"`).

- [ ] **Step 3: Build, install and probe computed styles**

Run: `pnpm build && pnpm vault:install --vault sample-vault`, then in light mode:
`obsidian vault=sample-vault eval code="(()=>{const t=getComputedStyle(document.querySelector('.inline-title'));const p=getComputedStyle(document.querySelector('.markdown-preview-view p, .cm-line'));return [t.fontFamily.split(',')[0],t.fontWeight,t.letterSpacing,p.lineHeight,getComputedStyle(document.body).getPropertyValue('--interactive-accent').trim()].join(' | ')})()"`
Expected: `"Albert Sans" | 500 | -1.8px | 30.6px | #0d0d0d` (45 px title at 18 px base; 18 × 1.7 = 30.6).

- [ ] **Step 4: Visual check routine**

Expected: headings, quote and body text match the blog post's proportions; Polish glyphs render in Albert Sans; dark mode uses the dark palette; no blue accent anywhere.

- [ ] **Step 5: Commit**

`git add src theme.css && git commit -m "feat: Minimum palette, Albert Sans and post typography"`

---

### Task 6: Note elements

**Files:**
- Modify: `src/editor.css`

**Interfaces:**
- Consumes: `--atrament-*` from Task 5.

- [ ] **Step 1: Variables on `body`**

`--link-decoration-thickness: 1px`; `--tag-radius: 999px`, `--tag-border-width: 1px`, `--tag-size: 0.875em`, `--tag-weight: 400`; `--code-radius: 6px`, `--code-size: 0.875em`; `--callout-radius: 12px`, `--callout-border-width: 0`, `--callout-title-weight: 600`, `--callout-blend-mode: normal`; `--table-text-size: 0.875em`, `--table-header-weight: 500`, `--table-column-first-border-width: 0`, `--table-column-last-border-width: 0`; `--hr-thickness: 1px`; `--image-radius: 12px`; `--embed-border-start`, `--embed-border-end`, `--embed-border-top`, `--embed-border-bottom`: `1px solid var(--atrament-line)`; `--checkbox-radius: 4px`.

- [ ] **Step 2: Selectors where no variable exists**

- Link underline: colour `--atrament-underline`, `text-underline-offset: 4px`, ink on hover, for reading view `a.internal-link`, `a.external-link` and Live Preview `.cm-hmd-internal-link .cm-underline`, `.cm-link .cm-underline`, `.cm-url .cm-underline` (confirm class names with `obsidian vault=sample-vault dev:dom selector=".cm-underline" total`).
- Inline code padding `0.15em 0.4em`; code blocks radius 12px and line height 1.7142857 (`.markdown-rendered pre`; Live Preview `.HyperMD-codeblock-begin` top and `.HyperMD-codeblock-end` bottom corners).
- Callout tints: `--atrament-callout-tint` set per `data-callout` group exactly as the spec's mapping, and `.callout { background-color: var(--atrament-callout-tint, var(--atrament-cover-neutral)) }`.
- Tables: no vertical rules in reading view and Live Preview.
- `hr`: `margin-block: 3em` in reading view.
- Embeds: radius 12px.
- Footnote references in reading view wrapped in `[` `]` via `::before`/`::after` (find the element with `dev:dom selector="sup"`).

- [ ] **Step 3: Build, install and probe**

Run: `pnpm build && pnpm vault:install --vault sample-vault`, reading view, light mode:
`obsidian vault=sample-vault eval code="(()=>{const g=(s)=>getComputedStyle(document.querySelector(s));return [g('.callout[data-callout=tip]').backgroundColor,g('.callout[data-callout=custom]').backgroundColor,g('a.tag').borderRadius,g('.markdown-rendered pre').borderRadius].join(' | ')})()"`
Expected: `rgb(227, 232, 216) | rgb(243, 243, 243) | 999px | 12px`.

- [ ] **Step 4: Visual check routine**

Expected: tags look like the blog's topic chips; callouts are flat tinted cards; footnotes read `[1]`; code blocks look like the blog's expressive-code blocks.

- [ ] **Step 5: Commit**

`git add src theme.css && git commit -m "feat: style links, tags, code, callouts, tables and footnotes like the blog"`

---

### Task 7: Interface

**Files:**
- Modify: `src/interface.css`

- [ ] **Step 1: Variables on `body`**

`--radius-s: 6px`, `--radius-m: 8px`, `--radius-l: 12px`; `--nav-item-radius: 8px`; `--tab-curve: 0`, `--tab-radius-active: 8px`; `--button-radius: 999px`; `--input-radius: 8px`; `--modal-radius: 12px`, `--menu-radius: 12px`; `--divider-width: 1px`. Buttons on `.theme-light, .theme-dark`: `--button-primary-bg-color`, `--button-primary-border-color`, `--button-primary-hover-bg-color`, `--button-primary-hover-border-color`, `--button-primary-active-bg-color` ink; `--button-primary-fg-color`, `--button-primary-hover-fg-color`, `--button-primary-active-fg-color` bg; `--button-secondary-bg-color` bg, `--button-secondary-fg-color` ink, `--button-secondary-border-color` line, `--button-secondary-hover-bg-color` surface, `--button-secondary-hover-border-color` line.

- [ ] **Step 2: Selectors where no variable exists**

`button.mod-cta:hover { opacity: 0.82 }`; leave `.mod-warning` alone. Do not set `background` on workspace containers (translucency).

- [ ] **Step 3: Build, install, and look at the chrome**

Run: `pnpm build && pnpm vault:install --vault sample-vault`; open the command palette (`obsidian vault=sample-vault eval code="app.commands.executeCommandById('command-palette:open')"`), Settings → Appearance, a file menu, the graph view; screenshot each in both modes.
Expected: one flat background, hairline dividers, `surface` pills for active items, ink primary pill, 12 px menus and modals with the soft shadow; with `body.is-translucent` (set it with `document.body.classList.add('is-translucent')` in `eval`) the sidebars still show translucency.

- [ ] **Step 4: Visual check routine, then commit**

`git add src theme.css && git commit -m "feat: flat interface with ink pills and hairline dividers"`

---

### Task 8: Install in the author's vault

- [ ] **Step 1: Ask for the go-ahead**

Ask the author before touching their vault: copy the theme into `~/Obsidian/Personal Life`, switch the theme from Cupertino to Atrament, base font size 14 → 18, text font JetBrains Mono → empty (monospace stays JetBrains Mono). Stop here until they say yes.

- [ ] **Step 2: Install and switch**

Run: `pnpm vault:install --vault "~/Obsidian/Personal Life"`, then `obsidian vault="Personal Life" theme:set name=Atrament` and `obsidian vault="Personal Life" eval code="app.vault.setConfig('baseFontSize',18);app.vault.setConfig('textFontFamily','');app.updateFontSize();app.updateFontFamily();"`.
Expected: `.obsidian/appearance.json` shows `"cssTheme": "Atrament"`, `"baseFontSize": 18`, `"textFontFamily": ""`, `"monospaceFontFamily": "JetBrains Mono"`.

- [ ] **Step 3: Look at real notes**

Screenshots of a daily note, a journal note, `Dashboard.md`, one Kanban board and one Dataview note, light and dark. Note anything that breaks for Task 9.

---

### Task 9: Plugin styles

**Files:**
- Modify: `src/plugins.css`

- [ ] **Step 1: Styles**

Kanban: `.kanban-plugin__lane` radius 12px (background and border already come from the variables); `.kanban-plugin__item` radius 12px, background `--atrament-surface`, `box-shadow: none`, with its inner title wrapper transparent so the surface shows. Dataview: `.dataview.inline-field-key` in `--atrament-muted`. Calendar: `#calendar-container { --color-dot: var(--atrament-ink); --color-text-today: var(--atrament-ink) }` (hover already uses `--interactive-hover`).

- [ ] **Step 2: Build, install in both vaults, look**

Run: `pnpm build && pnpm vault:install --vault sample-vault && pnpm vault:install --vault "~/Obsidian/Personal Life"`; screenshots of the Kanban board, the Dataview note and the Calendar sidebar in the author's vault, both modes.
Expected: Kanban cards are flat `surface` cards with 12 px corners; Calendar dots and today in ink; anything noted in Task 8 is fixed.

- [ ] **Step 3: Tests, check, commit**

Run: `pnpm test && pnpm check` (expected: only `missing file: screenshot.png`), then `git add src theme.css && git commit -m "feat: Kanban, Dataview and Calendar in the Atrament style"`.

---

### Task 10: Screenshot and README

**Files:**
- Create: `screenshot.png`
- Modify: `README.md`

- [ ] **Step 1: Screenshot**

In the sample vault, reading view of `Showcase.md` at 1280×720, `deviceScaleFactor` 1, sidebars open: `light.png` and `dark.png`. Then `magick light.png -crop 640x720+0+0 +repage l.png && magick dark.png -crop 640x720+640+0 +repage r.png && magick l.png r.png +append -resize 512x288 screenshot.png`.
Expected: `magick identify screenshot.png` reports `512x288`.

- [ ] **Step 2: README**

Sections: what Atrament is (the blog's "Minimum" design, link to the blog), the screenshot, features (palette, Albert Sans embedded, post typography, callout tints, Kanban/Dataview/Calendar), installation (community directory once listed; manual: copy `manifest.json` and `theme.css` into `.obsidian/themes/Atrament/`), development (`pnpm build`, `pnpm check`, `pnpm test`, `pnpm vault:install --vault <path>`), licences (theme MIT; Albert Sans by Usted, SIL OFL 1.1, `fonts/OFL.txt`).

- [ ] **Step 3: Check and commit**

Run: `pnpm test && pnpm check`
Expected: tests PASS; `check: ok`.
`git add screenshot.png README.md && git commit -m "docs: README and gallery screenshot"`

---

### Task 11: CI, GitHub repository and release 1.0.0

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/release.yml`

- [ ] **Step 1: Workflows**

Look up the current major versions with `gh api repos/actions/checkout/releases/latest --jq .tag_name` (and for `actions/setup-node`, `pnpm/action-setup`). `ci.yml`: on push and pull_request; checkout, pnpm, Node 24, `pnpm test`, `pnpm check`. `release.yml`: the workflow from Obsidian's "Release your theme with GitHub Actions" guide (tag push → `gh release create "$tag" --title="$tag" --generate-notes --draft manifest.json theme.css`), with `permissions: contents: write`. Commit: `ci: test and check on push, draft a release on tag`.

- [ ] **Step 2: Ask for the go-ahead, then create the repository**

After a yes: `gh repo create MBratkowski/obsidian-atrament --public --description "Obsidian theme in the style of the Minimum design of blog.mbratkowski" --source . --remote origin`, `git push -u origin main`, `git push -u origin feat/atrament-1.0`, then open a pull request to `main` with what the theme does, how it was verified and the screenshots.
Expected: CI passes on the pull request.

- [ ] **Step 3: Ask for the go-ahead, then merge and tag**

After a yes: merge the pull request, `git switch main && git pull`, `git tag -a 1.0.0 -m "1.0.0" && git push origin 1.0.0`.
Expected: the release workflow finishes and a draft release `1.0.0` has `manifest.json` and `theme.css` attached (`gh release view 1.0.0`).

- [ ] **Step 4: Ask for the go-ahead, then publish the release**

After a yes: `gh release edit 1.0.0 --draft=false`.
Expected: `gh release view 1.0.0` is no longer a draft.

- [ ] **Step 5: Hand over the submission**

Tell the author the last step is theirs: sign in at community.obsidian.md, link GitHub, add the theme from `MBratkowski/obsidian-atrament`, and send any automated review findings back to fix in a 1.0.1 release.
