// Builds a deck into one self-contained HTML file.
//
//   bun src/build.ts [slides.ts] [out.html]        defaults: ./slides.ts → dist/index.html
//
// The slides file exports `deck` (title, brand, theme, parts) and `slides` (an array of plain objects, one per slide),
// typed by src/types.ts.
// Each slide names a `layout`; renderBody() below turns it into HTML, and src/theme.css styles it.
// Add a layout: a `case` in renderBody() plus its CSS in src/theme.css, using the theme's variables.

import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { Deck, ListItem, Slide } from "./types.ts";

const here = import.meta.dir;
const slidesFile = resolve(process.argv[2] ?? "slides.ts");
const outFile = resolve(process.argv[3] ?? "dist/index.html");
const { deck, slides } = (await import(pathToFileURL(slidesFile).href)) as { deck: Deck; slides: Slide[] };
const assetDir = resolve(dirname(slidesFile), deck.assets ?? "assets");

const esc = (value: string | number = ""): string => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

// **bold** and `code`, nothing else: slides are short, and markup that grows into Markdown grows into documents.
const inline = (value = ""): string => esc(value)
  .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  .replace(/`(.+?)`/g, "<code>$1</code>");

// Images are embedded as data, so the deck stays one file that works offline.
// They are read once, before rendering, so the renderer itself stays synchronous.
const images = new Map<string, string>();
for (const slide of slides) {
  if (slide.layout === "screenshots") {
    for (const shot of slide.shots) {
      const file = Bun.file(resolve(assetDir, shot.image));
      images.set(shot.image, `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`);
    }
  }
}
const embedImage = (file: string): string => images.get(file) ?? "";

// An item is a string, or { text, example } to add an e.g. line under it.
const list = (items: ListItem[] = []): string => `<ul class="clean-list">${items.map((item) => (typeof item === "string" ? `<li>${inline(item)}</li>` : `<li>${inline(item.text)}<em><span>e.g.</span>${inline(item.example)}</em></li>`)).join("")}</ul>`;

// The brand mark: the first word bold, the rest italic, after three slashes (e.g. "Acme Engineering").
const [brandFirst = "", ...brandRest] = (deck.brand ?? deck.title).split(" ");
const brand = `<span class="brand-mark" aria-label="${esc(deck.brand ?? deck.title)}"><i></i><i></i><i></i><b>${esc(brandFirst.toUpperCase())}</b><em>${esc(brandRest.join(" ").toUpperCase())}</em></span>`;

const takeaway = (slide: { takeaway?: string }, extra = ""): string => (slide.takeaway ? `<p class="explain-takeaway${extra}"><span>${esc(deck.takeawayLabel ?? "Why it matters")}</span>${inline(slide.takeaway)}</p>` : "");
const note = (slide: { note?: string }): string => (slide.note ? `<p class="slide-note">${inline(slide.note)}</p>` : "");
const definition = (slide: { definition?: string }): string => (slide.definition ? `<p class="explain-def">${inline(slide.definition)}</p>` : "");

// Shell colouring (`lang: "shell"`): the command word highlighted, `# comments` muted, the rest as typed.
function shellLine(line: string): string {
  const hash = line.search(/(^|\s)#/);
  const body = hash === -1 ? line : line.slice(0, hash);
  const comment = hash === -1 ? "" : line.slice(hash);
  const [, command = "", rest = ""] = body.match(/^(\S*)(.*)$/s) ?? [];
  return `${command ? `<span class="cmd">${esc(command)}</span>` : ""}${esc(rest)}${comment ? `<span class="cmt">${esc(comment)}</span>` : ""}`;
}

function codeLines(slide: Extract<Slide, { layout: "code" }>): string {
  if (slide.lang === "shell") {
    return slide.code.map(shellLine).join("\n");
  }
  if (!slide.diff) {
    return esc(slide.code.join("\n"));
  }
  // diff: each line starts with " " or "+"; "+" lines are drawn in the highlight colour
  return slide.code.map((line) => (line.startsWith("+") ? `<span class="add">${esc(` ${line.slice(1)}`)}</span>` : esc(line))).join("\n");
}

function renderBody(slide: Slide): string {
  switch (slide.layout) {
    // The title slide.
    case "cover":
      return `<div class="cover-copy"><p class="eyebrow">${inline(slide.eyebrow)}</p><h1>${inline(slide.title)}</h1><p class="subtitle">${inline(slide.subtitle)}</p>${slide.kicker ? `<p class="kicker">${inline(slide.kicker)}</p>` : ""}</div><div class="tech-art" aria-hidden="true"><div class="orbit o1"></div><div class="orbit o2"></div><div class="orbit o3"></div><div class="signal"><i></i><i></i><i></i><i></i><i></i></div>${slide.motto ? `<code>${esc(slide.motto)}</code>` : ""}</div>`;
    // A divider between parts of a talk.
    case "section":
      return `<div class="section-copy"><p class="eyebrow">${inline(slide.eyebrow)}</p><h1>${inline(slide.title)}</h1><p class="subtitle">${inline(slide.subtitle)}</p></div><div class="section-art" aria-hidden="true"><i></i><i></i><i></i><b>${String(slides.indexOf(slide) + 1).padStart(2, "0")}</b></div>`;
    // One statement worth landing whole; `accent` is the part of the title drawn in the highlight colour.
    case "big": {
      const title = slide.accent ? inline(slide.title).replace(inline(slide.accent), `<mark>${inline(slide.accent)}</mark>`) : inline(slide.title);
      return `<div class="big-layout"><div class="big-copy"><p class="eyebrow">${inline(slide.eyebrow)}</p><h2>${title}</h2>${slide.subtitle ? `<p class="subtitle">${inline(slide.subtitle)}</p>` : ""}</div></div>`;
    }
    // The workhorse: a subject as the title, a one-sentence definition, points each with an example, a takeaway.
    case "explain": {
      const points = slide.points ?? [];
      const cols = points.length > 3 ? 2 : points.length > 1 ? points.length : 1;
      return [
        `<div class="explain-head"><p class="eyebrow">${inline(slide.eyebrow)}</p><h1>${inline(slide.title)}</h1>${definition(slide)}</div><div class="explain">`,
        points.length ? `<div class="explain-points" style="--n:${cols}">${points.map((point) => `<article>${point.meta ? `<i>${inline(point.meta)}</i>` : ""}<b>${inline(point.label)}</b><p>${inline(point.text)}</p>${point.example ? `<em><span>e.g.</span>${inline(point.example)}</em>` : ""}</article>`).join("")}</div>` : "",
        takeaway(slide),
        note(slide),
        `</div>`,
      ].join("");
    }
    // A genuine two-sided distinction.
    case "compare":
      return `<div class="top${slide.definition ? " has-def" : ""}"><p class="eyebrow">${inline(slide.eyebrow)}</p><h2>${inline(slide.title)}</h2>${definition(slide)}</div><div class="split${slide.takeaway ? " with-takeaway" : ""}"><div><h3>${inline(slide.leftTitle)}</h3>${list(slide.left)}</div><div><h3>${inline(slide.rightTitle)}</h3>${list(slide.right)}</div></div>${takeaway(slide, " split-takeaway")}${note(slide)}`;
    // Steps in order, left to right; `groups` draws bands over runs of steps.
    case "sequence":
      return `<div class="top"><p class="eyebrow">${inline(slide.eyebrow)}</p><h2>${inline(slide.title)}</h2>${definition(slide)}</div>${slide.groups ? `<div class="seq-groups" style="--steps:${slide.steps.length}">${slide.groups.map((group) => `<span style="grid-column:span ${group.span}">${inline(group.label)}</span>`).join("")}</div>` : ""}<ol class="sequence${slide.groups ? " grouped" : ""}" style="--steps:${slide.steps.length}">${slide.steps.map((step, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><b>${inline(typeof step === "string" ? step : step.label)}</b>${typeof step !== "string" && step.text ? `<small>${inline(step.text)}</small>` : ""}${typeof step !== "string" && step.example ? `<em><span>e.g.</span>${inline(step.example)}</em>` : ""}</li>`).join("")}</ol>${takeaway(slide, " seq-takeaway")}${note(slide)}`;
    case "table":
      return `<div class="top compact"><p class="eyebrow">${inline(slide.eyebrow)}</p><h2>${inline(slide.title)}</h2>${definition(slide)}</div><table${slide.bigTable ? ' class="big"' : ""}><thead><tr>${slide.columns.map((column) => `<th>${inline(column)}</th>`).join("")}</tr></thead><tbody>${slide.rows.map((row) => `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>${takeaway(slide)}${note(slide)}`;
    // Teaching from a fragment of code or a terminal session; `callout` sits beside it.
    case "code":
      return `<div class="top"><p class="eyebrow">${inline(slide.eyebrow)}</p><h2>${inline(slide.title)}</h2></div><div class="code-wrap"><div class="terminal${slide.bigCode ? " big" : ""}"><div class="terminal-bar"><i></i><i></i><i></i><span>${esc(slide.window ?? "terminal")}</span></div><pre><code>${codeLines(slide)}</code></pre></div>${slide.callout ? `<p class="callout">${inline(slide.callout)}</p>` : ""}</div>`;
    // A live demo or a discussion: a claim, then labelled step cards, then an optional line under them.
    case "demo":
      return `<div class="big-layout demo-layout"><div class="big-copy"><p class="eyebrow">${inline(slide.eyebrow)}</p><h2>${inline(slide.title)}</h2>${slide.subtitle ? `<p class="subtitle">${inline(slide.subtitle)}</p>` : ""}${slide.steps ? `<ol class="demo-steps">${slide.steps.map((step) => `<li><span>${inline(step.label)}</span><b>${inline(step.text)}</b></li>`).join("")}</ol>` : ""}${slide.rule ? `<p class="demo-rule">${inline(slide.rule)}</p>` : ""}</div></div>`;
    // Evidence side by side: images from the assets folder, each with a caption; `weight` sets each one's width.
    case "screenshots":
      return `<div class="top compact"><p class="eyebrow">${inline(slide.eyebrow)}</p><h2>${inline(slide.title)}</h2></div><div class="shots">${slide.shots.map((shot) => `<figure style="flex:${shot.weight ?? 1}"><img src="${embedImage(shot.image)}" alt="${esc(shot.alt)}"><figcaption>${inline(shot.caption)}</figcaption></figure>`).join("")}</div>${takeaway(slide, " shots-takeaway")}`;
    case "quote":
      return `<div class="quote-copy"><p class="eyebrow">${inline(slide.eyebrow)}</p><h2>${inline(slide.title)}</h2><blockquote>${inline(slide.quote)}</blockquote></div>`;
    // A recap: one line per thing learned, each with a check mark.
    case "checklist":
      return `<div class="top"><p class="eyebrow">${inline(slide.eyebrow)}</p><h2>${inline(slide.title)}</h2></div><ul class="checklist">${slide.items.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>${takeaway(slide, " checklist-takeaway")}`;
    // A task for the room.
    case "exercise":
      return `<div class="exercise"><p class="eyebrow">${inline(slide.eyebrow)}</p><h2>${inline(slide.title)}</h2><p class="prompt">${inline(slide.prompt)}</p>${list(slide.items)}</div>`;
    default:
      throw new Error(`Slide "${(slide as Slide).id}": unknown layout "${(slide as Slide).layout}"`);
  }
}

const ids = new Set<string>();
for (const slide of slides) {
  if (!slide.id || ids.has(slide.id)) {
    throw new Error(`Every slide needs a unique id; "${slide.id}" is ${slide.id ? "used twice" : "missing"}`);
  }
  ids.add(slide.id);
}

const parts = deck.parts ?? [];
const partOf = (slide: Slide) => parts.find((part) => part.id === slide.part);
const sections = slides.map((slide, index) => {
  const dark = ["cover", "section", "demo"].includes(slide.layout) ? " dark" : "";
  const part = partOf(slide);
  const counter = `${part ? `${inline(part.title)} · ` : ""}${String(index + 1).padStart(2, "0")}/${slides.length}`;
  const footer = slide.footer ?? part?.footer ?? deck.footer ?? deck.title;
  return `<section class="slide${dark}" id="${esc(slide.id)}" data-index="${index}"${slide.part ? ` data-part="${esc(slide.part)}"` : ""}${slide.reveal ? " data-reveal" : ""}><div class="stage-wrap"><div class="stage"><header class="chrome">${brand}<span class="part-label">${slide.partLabel ? inline(slide.partLabel) : counter}</span></header><main>${renderBody(slide)}</main><footer>${brand}<span>${inline(footer)}</span></footer></div></div>${slide.notes ? `<aside class="slide-notes" hidden>${inline(slide.notes)}</aside>` : ""}</section>`;
}).join("\n");

// deck.theme: { cyan: "#…", coral: "#…" } overrides the CSS variables of the same names (see src/theme.css).
const themeVars = Object.entries(deck.theme ?? {}).map(([name, value]) => `--${name}:${value}`).join(";");
const css = await Bun.file(resolve(here, "theme.css")).text();
// The browser runtime is TypeScript too; its types are stripped here, so the deck ships plain JavaScript.
const runtime = new Bun.Transpiler({ loader: "ts" }).transformSync(await Bun.file(resolve(here, "runtime.ts")).text());
const partButtons = parts.map((part) => `<button data-go="${esc(part.id)}">${esc(part.title)}</button>`).join("");

const html = `<!doctype html>
<html lang="${esc(deck.lang ?? "en")}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(deck.title)}</title>
<link rel="stylesheet" href="${esc(deck.fonts ?? "https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap")}">
<style>
${css}${themeVars ? `:root{${themeVars}}` : ""}
</style>
</head>
<body>
<div class="progress" id="progress"></div>
${sections}
<div class="navhint" id="navhint"><span><b>&rarr;</b> or <b>space</b> next</span><span><b>&larr;</b> back</span><span><b>O</b> overview</span><span><b>N</b> notes</span><button id="hintclose" aria-label="Hide the shortcuts and buttons; H shows or hides them"><b>H</b> show / hide</button></div>
<div class="hud"><button data-go="${esc(deck.overview ?? slides[0]?.id ?? "")}">Overview</button>${partButtons}<button id="help">? · keys</button></div>
<div class="notes-panel" id="notesPanel" aria-live="polite"></div>
<div class="help" id="helpPanel"><h2>Presentation controls</h2><dl><dt>→ / Space</dt><dd>Next step, or next slide</dd><dt>←</dt><dd>Previous step, or previous slide</dd><dt>Home / End</dt><dd>First or last slide</dd><dt>O</dt><dd>Overview slide</dd><dt>N</dt><dd>Speaker notes</dd><dt>H</dt><dd>Show or hide the shortcuts and buttons</dd><dt>Esc</dt><dd>Close this panel</dd></dl></div>
<script type="module">
${runtime}
</script>
</body>
</html>`;

await Bun.write(outFile, html); // creates dist/ if it is missing
console.log(`Wrote ${slides.length} slides to ${outFile}`);
