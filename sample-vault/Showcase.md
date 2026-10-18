---
tags:
  - sample
  - theme
date: 2026-10-18
description: A draft that exercises every element the Atrament theme styles.
---

Good typography is mostly invisible. When it works, you read the argument and never notice the type.

# Headings keep a steady rhythm

Each level steps down in size and weight, so a long draft stays easy to scan.

## Second level

Sections need room above them, otherwise they blur together.

### Third level

The third level is where most subsections live.

#### Fourth level

Smaller headings still need room above them.

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
> The first draft of this post was twice as long. Most of what I cut was throat-clearing.

> [!tip]
> Read the draft on your phone before you publish. A paragraph that looks fine on a laptop can turn into a wall of text.

> [!question]
> Does anyone notice the line height? Probably not, and that is the point.

> [!warning]
> A heading every two paragraphs is not structure. It is a table of contents in disguise.

> [!danger]
> Publish the same evening you finish, and the typo in the title goes out to every RSS reader.

> [!custom] Before publishing
> Open every link, read the post aloud once, and cut the last paragraph if it only repeats the first.

## Table

| Draft | Words | Reading time |
| --- | --- | --- |
| First pass | 2,400 | 12 min |
| Second pass | 1,650 | 9 min |
| Published | 1,200 | 6 min |

---

![[cover.png]]

![[Embedded note]]

[^1]: Links age faster than the text around them, so I open every one again on the day the post goes out.
