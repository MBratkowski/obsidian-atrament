# Atrament: an Obsidian theme in the style of the blog

Date: 2026-10-18
Status: approved in conversation, waiting for spec review

## Goal

Atrament is an Obsidian app theme that brings the look of the author's blog
(https://blog.mbratkowski.workers.dev, source `MBratkowski/blog`) into Obsidian, and is published in
the official Obsidian community theme directory.

It serves two purposes at once:

1. The whole vault looks like the blog: daily notes, journal, Kanban boards, sidebars, menus.
2. A blog draft in the editor reads like the published post: same typeface, line height, heading
   scale, quotes, code and footnotes, so writing in Obsidian previews the post.

Success means: a note and the same text on the blog, side by side at the same width, read as the same
design in light and dark mode; the theme works on desktop and phone; it passes the community
directory's automated review.

## Decisions taken

| Question | Decision |
|---|---|
| Purpose | Whole vault in the blog style, and note typography mirrors post typography |
| Where the source lives | Its own repository, `MBratkowski/obsidian-atrament` (public), locally `~/Projects/web/tools/obsidian-atrament` |
| Distribution | Official community theme directory |
| Name | Atrament (Polish for ink, the text colour of the palette); free in `community-css-themes.json` |
| Build | Several source files and a dependency-free Node build script (approach A) |
| Quotes | The blog's pull quote for every `>` quote, no toggle |
| Style Settings | Not in 1.0 |

## Source of the design

The blog's "Minimum" design: one typeface (Albert Sans), black and white, colour only on post covers.
Values come from `src/styles/global.css`, `tailwind.config.ts` (typography plugin) and
`src/site.config.ts` (expressive-code) in `MBratkowski/blog`. Atrament copies the values once into
`src/tokens.css` with a comment that names the blog files they came from; there is no automatic sync
between the repositories.

### Palette

| Token | Light | Dark | Role |
|---|---|---|---|
| `bg` (global-bg) | #ffffff | #0d0d0d | note, sidebars, ribbon, status bar, title bar |
| `ink` (global-text) | #0d0d0d | #f2f2f2 | headings, bold, links, accent |
| `body` | #1a1a1a | #e6e6e6 | normal text |
| `muted` | #5d5d5d | #a3a3a3 | secondary text, icons, table headers, properties |
| `faint` | #8a8a8a | #737373 | placeholders, unresolved links, done tasks |
| `surface` | #f3f3f3 | #1a1a1a | hover, active item, code, Kanban cards |
| `line` | #e6e6e6 | #2a2a2a | dividers, borders, table rules, tag outline |
| `underline` | #bdbdbd | #5d5d5d | link underline, checkbox outline, hover border |
| `mark` | #ffe58a | #5c4d14 | `==highlight==` and text selection |
| `cover-sand` | #e9e1d6 | #2b2722 | callouts: warning |
| `cover-steel` | #dce5ec | #1f262c | callouts: note, info |
| `cover-sage` | #e3e8d8 | #252a20 | callouts: tip, success |
| `cover-blush` | #f0dcd3 | #2e2421 | callouts: danger, error |
| `cover-lilac` | #e4dfed | #27232e | callouts: question, example, quote |
| `cover-neutral` | #f3f3f3 | #1a1a1a | callouts: unknown or custom types |

Code syntax colours come from the github-light and github-dark themes, which the blog uses through
expressive-code.

The theme deliberately ignores the accent colour picked in Obsidian's settings: the accent is `ink`.

## Design

### Typography

- Typeface: Albert Sans, weights 400 to 600, normal and italic, subsets latin and latin-ext (Polish),
  embedded as base64 woff2. Used for text and interface.
- Monospace: the blog's stack, `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
  "Liberation Mono", "Courier New", monospace`. A monospace font chosen in Obsidian's settings still
  wins, as Obsidian intends.
- The theme does not set the base font size; that is the user's setting. The blog's body size is
  18 px, so the author's vault moves from 14 to 18 px at install time (see Installation).
- Body: line height 1.7; paragraph spacing 1.2em in reading view; readable line width 700 px (the
  blog's column); bold weight 600.
- Inline title (the note name) mirrors the post title: weight 500, letter spacing -0.04em, line
  height 1.04, size 2.5em.
- Headings, all weight 500 with letter spacing -0.02em:

  | Level | Size | Line height | Colour |
  |---|---|---|---|
  | H1 | 2em | 1.1 | ink |
  | H2 | 1.65em | 1.15 | ink |
  | H3 | 1.25em | 1.3 | ink |
  | H4 | 1em | 1.5 | ink |
  | H5, H6 | 1em | 1.5 | muted |

- Quote (`>`): the blog's pull quote in reading view and Live Preview: size 1.35em, weight 500, line
  height 1.3, letter spacing -0.02em, colour ink, no border, no background, not italic.

### Note elements

- Links (internal and external): ink, 1 px underline in `underline`, offset 4 px; the underline turns
  ink on hover. Unresolved links: `faint`, same underline.
- Tags: the blog's topic chip. Transparent fill, 1 px `line` outline, radius 999 px, ink text at
  0.875em; `surface` fill on hover.
- Inline code: `surface` background, radius 6 px, padding 0.15em 0.4em, weight 400.
- Code blocks: `surface` background, radius 12 px, size 0.875em, line height 1.7142857, github
  syntax colours.
- Callouts: flat cards, radius 12 px, no border, background from the cover colour of the type, title
  weight 600, title and icon in ink. Mapping by `data-callout` type:
  - steel: note, info, todo
  - sage: tip, hint, important, success, check, done
  - lilac: abstract, summary, tldr, question, help, faq, example, quote, cite
  - sand: warning, caution, attention
  - blush: failure, fail, missing, danger, error, bug
  - neutral: any other type
- Tables: size 0.875em; header weight 500 in `muted`; horizontal `line` rules only, no vertical rules.
- Horizontal rule: 1 px `line`, 3em space above and below in reading view.
- Images and embeds: radius 12 px; embeds get a 1 px `line` border.
- Footnote references in reading view show as `[1]`, like the blog.
- Task checkboxes: radius 4 px, `underline` outline; checked fills with ink and a `bg` tick; done
  task text in `faint`.
- Properties (frontmatter): small text in `muted`, like the meta line under a post title.

### Interface

- Sidebars, ribbon, tab bar, status bar and title bar share the `bg` background; panes are separated
  by 1 px `line` dividers, not by fills.
- File explorer, outline, search and other nav items: hover and active item on `surface`, radius
  8 px; active item text in ink.
- Tabs: flat, no curved tab shape; active tab on `surface`, others in `muted`.
- Buttons: the primary button (`mod-cta`) is the blog's ink pill (radius 999 px, `bg` text, opacity
  on hover); other buttons are outline pills (1 px `line`, `surface` on hover). Warning buttons keep
  Obsidian's red for safety.
- Inputs: 1 px `line` border, radius 8 px, ink focus ring like the blog's `:focus-visible`.
- Menus, modals, the command palette, hover previews and notices: `bg` background, 1 px `line`
  border, radius 12 px, shadow `0 12px 32px rgb(0 0 0 / 0.14)` (the blog's footnote popover).
- Toggles and sliders: ink when on.
- Graph view: nodes in `muted`, lines in `line`, focused node in ink, tags and attachments in
  `faint`.
- Translucency: when Obsidian's translucency setting is on, the theme leaves it working; it sets
  colours only through variables and does not paint opaque backgrounds on workspace containers.
- Phone and tablet: the same design; nothing is desktop-only.

### Plugin support

Only these plugins get explicit styles; everything else inherits through Obsidian's variables.

- Kanban: lanes on `bg` with a 1 px `line` border and radius 12 px; cards on `surface`, radius
  12 px, no shadow.
- Dataview: tables follow the table rules above; inline fields use `muted` keys.
- Calendar (Liam Cain): dots and today's date in ink, hover on `surface`.

### Engineering rules

- Override Obsidian's CSS variables first: general values on `body`, colours on `.theme-light` and
  `.theme-dark`. Use selectors only where no variable exists, and keep them short and low in
  specificity.
- No `!important`.
- No network access: no remote `url()`, no `@import` of anything. Fonts are embedded as data URLs.
- Variables of the theme's own palette are named `--atrament-*` so they never collide with
  Obsidian's.

## Repository

```
manifest.json        name "Atrament", version, minAppVersion "1.14.4", author, authorUrl
theme.css            built output, committed (Obsidian installs it from the GitHub release)
screenshot.png       512 x 288, light and dark halves of the sample note
README.md            what it is, screenshot, install, development, licences
LICENSE              MIT, for the theme
fonts/               Albert Sans woff2 files and OFL.txt
src/
  fonts.css          @font-face rules with placeholders for the font data
  tokens.css         palette, light and dark, mapped to Obsidian variables
  typography.css     text, headings, inline title, quotes, lists
  editor.css         links, tags, code, callouts, tables, embeds, footnotes, tasks, properties
  interface.css      sidebars, tabs, buttons, inputs, menus, modals, graph
  plugins.css        Kanban, Dataview, Calendar
scripts/
  build.mjs          concatenate src/ in the order above, inline fonts, write theme.css
  check.mjs          rules from "Checks" below
  vault-install.mjs  copy manifest.json and theme.css into a vault
tests/               node:test tests for build, check and vault-install
sample-vault/        notes that show every styled element (see "Verification")
.github/workflows/
  ci.yml             pnpm test and pnpm check on push and pull request
  release.yml        tag push creates a draft GitHub release with manifest.json and theme.css
package.json         scripts only, no dependencies
```

Fonts: Albert Sans woff2 from Google Fonts, one file per subset and style (latin, latin-ext; normal,
italic), variable weight 400 to 600. The OFL text is the same file the blog ships
(`src/assets/albert-sans-OFL.txt`). The README credits the font and its licence.

### Scripts

| Command | What it does |
|---|---|
| `pnpm build` | Writes `theme.css` from `src/` and `fonts/`, with a header comment naming the version from `manifest.json` |
| `pnpm check` | Runs the checks below; exits 1 and lists every failure |
| `pnpm test` | `node --test tests/` |
| `pnpm vault:install --vault <path>` | Copies `manifest.json` and `theme.css` into `<path>/.obsidian/themes/Atrament/` as real files; `ATRAMENT_VAULT` may replace `--vault`; exits 1 if the vault has no `.obsidian` folder |

`vault:install` copies files instead of linking them because Obsidian Sync does not sync symbolic
links, and the author's vault reaches the phone through Sync.

### Checks

`pnpm check` fails when:

- `theme.css` differs from a fresh build of `src/` and `fonts/`;
- any file in `src/` or `theme.css` contains `!important`;
- any `url()` points anywhere but a `data:` URL, or any `@import` exists;
- `manifest.json` has no `name` "Atrament", or `version` is not `x.y.z`, or `minAppVersion` is missing;
- `README.md`, `LICENSE`, `screenshot.png`, `fonts/OFL.txt`, `manifest.json` or `theme.css` is missing;
- `theme.css` is larger than 500 KB (a guard against embedding the wrong font files).

## Verification

`sample-vault/` holds a showcase note with every element from "Note elements" (all heading levels,
paragraphs with bold, italic, highlight and links, quote, lists, tasks, tags, inline code, code
blocks in two languages, every callout colour, a table, an image, an embed, footnotes, properties).
It has no community plugins; Kanban, Dataview and Calendar are checked in the author's vault. Its `.obsidian/` folder is not committed; `pnpm vault:install
--vault sample-vault` puts the theme there. If Obsidian cannot register the folder as a vault from
the command line, the author opens it once with "Open folder as vault".

With Obsidian's CLI (`theme:set`, `dev:screenshot`, `dev:mobile`, `eval`):

1. Screenshots of the sample note in light and dark mode, desktop window and mobile emulation.
2. The same text compared side by side with a blog post at the same width in the browser: typeface,
   size ratios, weights, colours, quote, code, link underline.
3. `dev:errors` shows nothing caused by the theme.
4. In the author's vault: a daily note, a journal note, a Kanban board, a Dataview note, the Calendar
   sidebar and callouts look right in both modes.

`pnpm test` and `pnpm check` pass before every commit that changes `src/`, `scripts/` or `theme.css`.

## Installation in the author's vault

After `pnpm vault:install --vault "~/Obsidian/Personal Life"`, and only with the author's go-ahead at
that moment, change Obsidian's appearance settings in that vault:

- theme Cupertino to Atrament;
- base font size 14 to 18 px;
- text font JetBrains Mono to empty (the theme's Albert Sans); the monospace font stays JetBrains Mono.

The `macos-native-tuning.css` snippet stays disabled, as it is today.

## Release and submission

Each step that leaves the machine needs the author's go-ahead at that moment.

1. Create the public GitHub repository `MBratkowski/obsidian-atrament` and push `main`.
2. Push the tag `1.0.0` (matching `manifest.json`); the release workflow creates a draft release with
   `manifest.json` and `theme.css` attached; publish the draft.
3. The author submits the theme at community.obsidian.md with their Obsidian account (it needs
   their sign-in), then fixes anything the automated review reports in a new release.

## Out of scope

- Style Settings options.
- An Obsidian Publish theme.
- Tuning for the Pseudo Mica plugin.
- Styles for plugins other than Kanban, Dataview and Calendar.
- PDF export and print styles.
- Keeping `src/tokens.css` in sync with the blog automatically.
