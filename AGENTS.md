# agent-slides

A slide deck kept as data. `slides.ts` holds the content; `src/` turns it into one self-contained HTML file and checks
it. Read this file before changing anything; read `.claude/skills/slide-authoring/SKILL.md` before writing a slide.

## Commands

| Command                                    | What it does                                                                                          |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `bun run build`                            | `slides.ts` → `dist/index.html`                                                                       |
| `bun run dev`                              | live preview: serves the deck, opens it, rebuilds and reloads the page on every change                |
| `bun run show`                             | build, then open `dist/index.html` in the default browser                                             |
| `bun run check`                            | build, then check every slide in a real browser; fails on overflow or placeholder text                |
| `bun run shot <id>…` or `bun run shot all` | screenshots to `.tmp/shots/<id>.png`, every reveal step shown                                         |
| `bun run typecheck`                        | `tsc` over `slides.ts` and `src/`: a wrong layout or field is an error here                           |
| `bun run pptx`, `bun run pdf`              | export to `dist/deck.pptx` or `dist/deck.pdf`, one page per reveal step (`--final` for one per slide) |

## Rules

- **Never edit a built file.** `dist/` is generated. Change `slides.ts`, `src/theme.css` or `src/build.ts`.
- **Done means checked.** `bun run typecheck` and `bun run check` pass, and you have looked at the screenshot of every
  slide you changed. Layout bugs only show in a render; say what you looked at.
- **Never shrink type to make a slide fit.** Cut words, or split the slide. The checker names the fix.
- **One idea per slide**, a heading that names the subject, a one-sentence definition, an example for every point.
- **Plain words, easy to remember.** If a reader has to stop and work out what a sentence means, rewrite it; keep one
  word for one idea. The `slide-authoring` skill has the rule and examples.
- **Theme through variables.** Colours are CSS variables in `src/theme.css`; change them in `deck.theme`, never as
  a hex code inside a layout.
- **A new layout** is a type in `src/types.ts`, a `case` in `renderBody()` in `src/build.ts`, and its CSS in
  `src/theme.css`. Add an example slide that uses it, and check its screenshot.

## Where things are

`slides.ts` (your deck) · `src/types.ts` (every layout and field) · `src/build.ts` (renderer) · `src/runtime.ts`
(navigation, reveal steps, notes, in the browser) · `src/theme.css` (all styling) · `src/check.ts` (the checker) ·
`src/export.ts` (PowerPoint, PDF) · `assets/` (images for `screenshots` slides).
