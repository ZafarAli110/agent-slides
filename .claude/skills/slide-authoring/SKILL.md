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

## Plain words, whole sentences

A slide is read once, at the speed of the talk. If a reader has to stop and work out what a sentence means, rewrite
it: more words are better than a riddle.

- **Say it the way you would to a colleague.** Everyday words; a term only once it has been defined.
- **Whole sentences: who does what.** Not a compressed slogan the reader has to unpack.
- **One idea per sentence.** Two ideas joined by a colon or a semicolon are usually two sentences.
- **Nothing left for the reader to fill in.** A number has its unit ("42 seconds", not "0:42"); a pronoun's thing is
  named; a comparison says what it is compared with.
- **Read it aloud to someone new.** If they would ask "meaning what?", rewrite it.
- **Easy to remember.** A takeaway someone could repeat the next day: short and concrete, a picture rather than an
  abstraction. Keep the same words every time an idea comes back (a "hook" on every slide, never a "guard" on one):
  a new word makes the reader wonder whether it is a new thing.

| Hard to read                                                                     | Plain                                                                                                  |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| "Put each rule at the weakest strength that holds. Waivers need friction."       | "CLAUDE.md asks; a hook runs every time. Use one for a rule that must hold whoever decides."           |
| "'Never commit without asking' is only real if `git commit` is on the ask list." | "'Ask before you commit' in CLAUDE.md is a request; `git commit` on the ask list stops it every time." |
| "1,600,010 rows in 0:42"                                                         | "1,600,010 rows in 42 seconds"                                                                         |

## Pick the layout from the shape of the idea

| The idea is                                | Layout             |
| ------------------------------------------ | ------------------ |
| a concept: definition, points, takeaway    | `explain`          |
| two sides of a real distinction            | `compare`          |
| steps in order                             | `sequence`         |
| the same questions asked of several things | `table`            |
| a fragment of code or a terminal session   | `code`             |
| a live demo, or a task for the room        | `demo`, `exercise` |
| one statement worth landing whole          | `big`, `quote`     |
| a recap                                    | `checklist`        |

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

`bun run dev` is the person's live preview: if it is running, every save reloads their page. Don't start it yourself;
it is a server that never exits. The checks above are how you see the slides.
