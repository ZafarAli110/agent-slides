# agent-slides

**Slides your coding agent writes, and a harness that checks them.**

Agentic engineering for slide decks. Your deck is a typed TypeScript file, `slides.ts`; agent-slides renders it into
one HTML file that works offline, checks every slide in a real browser, and exports to PowerPoint or PDF.
A coding agent (Claude Code, Copilot, Cursor, Codex) can write it, because a slide is data, not boxes on a canvas,
and the checks tell the agent when a slide is wrong.

- **Content as data.** Each slide is an object with a layout: `explain`, `compare`, `sequence`, `table`, `code`,
  `demo`, `screenshots`, `big`, `quote`, `checklist`, `exercise`, `cover`, `section`. `src/types.ts` types every one.
- **A checker that fails.** `bun run check` measures every slide at 1280×720 and fails on overflow, naming the fix
  ("cut a sentence, or drop one point"); it warns on wordy slides and on any that had to shrink to fit.
- **Screenshots to look at.** `bun run shot all` writes a PNG per slide, for you and for your agent.
- **Reveal on demand.** `reveal: true` builds a slide up one point, row or step per key press, like PowerPoint.
- **Speaker notes**, a presenter bar, and keys: → next, ← back, N notes, O overview, H show or hide the bar.
- **Export.** `bun run pptx` and `bun run pdf`, one page per reveal step, notes in PowerPoint's notes pane.
- **An agent kit.** `AGENTS.md` (always read) and a `slide-authoring` skill (loaded when a slide is written): a style
  guide your agent follows, so every slide comes out the same way.

## Start

You need [Bun](https://bun.sh) 1.4.4 or later.

```bash
git clone https://github.com/ZafarAli110/agent-slides.git my-talk
cd my-talk
bun install
bunx playwright install chromium     # the browser the checker and the exporter use
bun run check                        # builds dist/index.html and checks every slide
```

Open `dist/index.html` in a browser and present. The commands are the same on Windows (PowerShell), macOS and Linux.

## Write a slide

```ts
// slides.ts
{
  id: "context-window",
  layout: "explain",
  reveal: true,
  title: "The context window",
  definition: "All the text the model can use for one response.",
  points: [
    { label: "Rebuilt every call", text: "The app sends the whole conversation again, every turn.", example: "turn 40 re-sends turns 1–39" },
  ],
  takeaway: "Not how big the window is, but what earned its place.",
  notes: "Ask the room what they think the model remembers between calls.",
}
```

Or ask your agent: *"Add a slide after the-loop that explains caching, with an example per point."* It reads
`AGENTS.md`, writes the slide, runs the checks and looks at the screenshot.

## Make it yours

| To change | Edit |
|---|---|
| title, brand mark, footer, parts of the talk | `deck` in `slides.ts` |
| colours | `deck.theme`, e.g. `{ cyan: "#7CC7FF", coral: "#F2A65A" }` (variables in `src/theme.css`) |
| fonts | `deck.fonts` (a Google Fonts URL) and the font variables in `src/theme.css` |
| a layout's look | its CSS in `src/theme.css` |
| a new layout | a type in `src/types.ts`, a `case` in `renderBody()` (`src/build.ts`), its CSS |

## Commands

| | |
|---|---|
| `bun run build` | `slides.ts` → `dist/index.html` |
| `bun run check` | build and check; exits 1 on overflow or placeholder text |
| `bun run shot <id>… \| all` | screenshots to `.tmp/shots/` |
| `bun run typecheck` | type-check `slides.ts` and `src/` |
| `bun run pptx` / `bun run pdf` | export (`-- --final` for one page per slide) |

Bun runs the TypeScript directly; `bun run typecheck` runs `tsc` to check the types, which Bun itself does not do.

## Why "harness"

A harness is everything around a model that decides what it sees, what it may do and whether its work counts. Here:
the style guide is what the agent sees, the types and the layouts are what it may do, and the checker and the
screenshots decide whether a slide is done. agent-slides came out of a workshop on harness engineering with Claude
Code, whose deck was built this way.

## Licence

MIT © 2026 Zafar Ali
