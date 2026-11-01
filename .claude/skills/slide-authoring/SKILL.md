---
name: slide-authoring
description: How to write, edit or review a slide in this deck - headings, definitions, examples, which layout to use, when to reveal, and the checks before calling it done. Use for any change to slides.ts, or a request to add, improve or restructure slides.
---

# Writing slides

## A heading names the subject

Clear first, then professional, then short: never trade down that list. "The context window", not "Context is
working memory, measured in tokens" (that is the definition) and not "Memory lane" (cute, says nothing). If a heading
needs the slide to be understood, it is not a heading.

## Define before you elaborate

An `explain` slide opens with `definition`: one plain sentence saying what the thing **is**, for someone who has never
heard the term. Do not use a word before the slide that defines it.

## Every point gets an example

`example` renders as an **e.g.** line under the point. Make it small, specific and from the audience's own work:
"a spam filter trained on mail you marked as junk", not "classification tasks". Carry one example across
neighbouring slides rather than inventing a fresh one each time.

## Readable later, on its own

Each slide must make sense to someone who reads it a week later without the talk: the heading names the subject,
each point is a short whole sentence, and a demo slide says what happened. More words are fine when they add that.
`bun run check` warns past 110 words: check each sentence earns its place. The hard limit is fit: never shrink type.

## Pick the layout from the shape of the idea

| The idea is | Layout |
|---|---|
| a concept: definition, points, takeaway | `explain` |
| two sides of a real distinction | `compare` |
| steps in order | `sequence` |
| the same questions asked of several things | `table` |
| a fragment of code or a terminal session | `code` |
| a live demo, or a task for the room | `demo`, `exercise` |
| one statement worth landing whole | `big`, `quote` |
| a recap | `checklist` |

A diagram is earned only when the claim itself is a structure (containment, order, flow). Never add a picture to make
a slide "less boring"; boring usually means too dense, or two ideas on one slide.

## End on "so what"

`takeaway` renders under a "Why it matters" label. It says why the audience should care, not what the slide said.
If it restates the definition, cut it.

## Reveal on demand

`reveal: true` shows the points, list items, steps or rows one per key press, then the takeaway. Use it where the
room should not read ahead (a comparison you argue side by side, steps you walk through), not on every slide.

## Speaker notes

`notes` are spoken by the presenter and shown with N: delivery guidance (what to point at, what to ask the room),
never a summary of the slide.

## Before calling it done

```bash
bun run typecheck
bun run check
bun run shot <ids you changed>
```

Then open each screenshot in `.tmp/shots/` and look. Overflow, collisions and a layout keyed to the wrong slide only
show in a render. Say which screenshots you looked at.
