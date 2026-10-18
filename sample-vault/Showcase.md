---
tags:
  - sample
  - theme
date: 2026-10-18
description: A draft that exercises every element the Atrament theme styles.
---

## Typography

Good typography is mostly invisible. When it works, you read the argument and never notice the type.

### Headings keep a steady rhythm

Each level steps down in size and weight, so a long draft stays easy to scan.

#### Fourth level

Smaller headings still need room above them, otherwise sections blur together.

##### Fifth level

At this depth the heading is closer to a label than a title.

###### Sixth level

The last level should still be distinguishable from body text.

## Inline text

Writing a draft is mostly **deciding what to cut**, and *rereading it aloud* helps more than any tool. Sometimes a sentence deserves ==a highlight== so it survives the next edit. See the [[Embedded note]] for a transcluded example, a [[Note that does not exist yet]] for an unresolved link, and the [Obsidian help site](https://help.obsidian.md) for an external one.[^1]

Polish glyphs: Zażółć gęślą jaźń. ZAŻÓŁĆ GĘŚLĄ JAŹŃ.

> A theme is a promise about reading. It should get out of the way and let the words carry the page.

## Lists

- A bulleted item with a short phrase
- Another item that is long enough to wrap onto a second line when the pane is narrow, which checks hanging indents
  - A nested item

1. First numbered step
2. Second numbered step
3. Third numbered step

- [x] A finished task
- [ ] A task still waiting

Tags in the text: #draft and #blog/typography.

## Code

Use `inline code` for short names such as `--font-text`.

```js
const words = text.split(/\s+/).filter(Boolean);
console.log(`Reading time: ${Math.ceil(words.length / 200)} min`);
```

```css
.markdown-rendered p {
  max-width: 38rem;
  line-height: 1.6;
}
```

## Callouts

> [!note]
> A plain note with a sentence of explanation.

> [!tip]
> A tip that suggests a small improvement.

> [!question]
> A question the reader may be asking.

> [!warning]
> A warning about something easy to miss.

> [!danger]
> A danger that deserves the strongest colour.

> [!custom] A custom callout
> Unknown types fall back to the default look.

## Table

| Element | Light | Dark |
| --- | --- | --- |
| Paper | cream | charcoal |
| Ink | near black | warm white |
| Accent | blue | light blue |

---

![[cover.png]]

![[Embedded note]]

[^1]: The footnote text sits at the bottom of the note.
