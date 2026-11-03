// Checks a built deck in a real browser, at the real stage size (1280×720), and can screenshot slides.
//
//   bun src/check.ts [dist/index.html] [--shot <slide-id>... | --shot all]
//
// Fails (exit 1) when a slide's content does not fit its stage or still holds placeholder text.
// Warns when a slide is over the word budget: a prompt to check each sentence earns its place, not a rule.
// Screenshots go to .tmp/shots/<id>.png, with every reveal step shown. Look at them: layout bugs only show in a render.

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

interface Measured {
  id: string;
  zoom: number;
  over: number;
  words: number;
  text: string;
  untitled: boolean;
}

const args = process.argv.slice(2);
const shotAt = args.indexOf("--shot");
const shots = shotAt === -1 ? [] : args.slice(shotAt + 1);
const target = resolve((shotAt === -1 ? args[0] : args.slice(0, shotAt)[0]) ?? "dist/index.html");
const WORD_BUDGET = Number(process.env.WORD_BUDGET ?? 110);

if (!(await Bun.file(target).exists())) {
  console.error(`No deck at ${target}. Build it first: bun run build`);
  process.exit(1);
}

// Overflow is a spectrum. Naming the proportionate fix stops the reflex reaction, shrinking type, which is how a deck
// slowly becomes unreadable at the back of the room.
const remedy = (px: number): string => {
  if (px <= 40) {
    return "tighten one gap, or cut a clause";
  }
  if (px <= 90) {
    return "cut a sentence, or drop one point";
  }
  if (px <= 160) {
    return "cut a point, or move it to its own slide";
  }
  return "wrong layout for this much content: split the slide";
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto(pathToFileURL(target).href);
await page.evaluate(() => document.fonts.ready);
// The runtime shrinks a slide that is slightly too big (down to 88%). Measure after that, and report every slide that
// needed it, so nothing shrinks quietly.
// Measure every slide fully built: hidden reveal steps sit lower until they appear, which is not overflow.
await page.evaluate(() => document.querySelectorAll(".slide").forEach((slide) => window.agentSlides.reveal(slide.id, window.agentSlides.steps(slide.id))));
await page.addStyleTag({ content: ".rv{transition:none!important}" });
await page.waitForTimeout(300);

const slides: Measured[] = await page.$$eval(".slide", (els) => els.map((el) => {
  const main = el.querySelector("main");
  const heading = el.querySelector("h1, h2");
  const words = (node: Element | null): number => (node?.textContent ?? "").trim().split(/\s+/).filter(Boolean).length;
  // A layout that pushes its content upward never scrolls: it runs into the definition instead. Touching is not
  // enough (a timeline's dots and the text's descenders cross), so ask for 6px between them.
  const definition = el.querySelector(".explain-def");
  const next = el.querySelector(".explain-points, .sequence, .split, table, .demo-steps");
  const crowded = definition && next
    ? Math.round(definition.getBoundingClientRect().bottom - next.getBoundingClientRect().top + 6)
    : 0;
  return {
    id: el.id,
    zoom: Number((main as HTMLElement | null)?.style.zoom || 1),
    over: Math.max(main ? Math.max(main.scrollHeight - main.clientHeight, main.scrollWidth - main.clientWidth) : 0, crowded),
    words: words(main) - words(heading),
    text: (main?.textContent ?? "").trim(),
    untitled: !(heading?.textContent ?? "").trim(),
  };
}));

const overflowing = slides.filter((slide) => slide.over > 2);
const placeholders = slides.filter((slide) => /\b(TBD|TODO|FIXME|Lorem ipsum|XXX)\b/i.test(slide.text));
const untitled = slides.filter((slide) => slide.untitled);
const shrunk = slides.filter((slide) => slide.zoom < 1 && slide.over <= 2);
const wordy = slides.filter((slide) => slide.words > WORD_BUDGET).sort((a, b) => b.words - a.words);

console.log(`${slides.length} slides · ${target}`);
if (overflowing.length) {
  console.log(`\nOVERFLOW (${overflowing.length}):`);
  for (const slide of overflowing) {
    console.log(`  ✗ ${slide.id}: ${slide.over}px too big · ${remedy(slide.over)}`);
  }
} else {
  console.log("✓ every slide fits its stage");
}
if (shrunk.length) {
  console.log(`\nSHRUNK TO FIT (${shrunk.length}): fine on a laptop; cut copy before it costs readability.`);
  for (const slide of shrunk) {
    console.log(`  ! ${slide.id}: ${Math.round(slide.zoom * 100)}%`);
  }
}
if (placeholders.length) {
  console.log(`\nPLACEHOLDER TEXT (${placeholders.length}):`);
  for (const slide of placeholders) {
    console.log(`  ✗ ${slide.id}`);
  }
}
if (untitled.length) {
  console.log(`\nNO HEADING (${untitled.length}):`);
  for (const slide of untitled) {
    console.log(`  ! ${slide.id}`);
  }
}
if (wordy.length) {
  console.log(`\nOVER ${WORD_BUDGET} WORDS (${wordy.length}): check each sentence earns its place; never shrink the type.`);
  for (const slide of wordy) {
    console.log(`  ! ${slide.id}: ${slide.words} words`);
  }
}

const wanted = shots[0] === "all" ? slides.map((slide) => slide.id) : shots;
if (wanted.length) {
  await page.addStyleTag({ content: ".navhint,.hud,.progress{display:none!important}.rv{transition:none!important}" });
  await page.evaluate(() => document.querySelectorAll<HTMLElement>(".stage main").forEach((main) => {
    main.style.zoom = "";
  }));
  for (const id of wanted) {
    const stage = page.locator(`[id="${id}"] .stage`);
    if (!(await stage.count())) {
      console.log(`  ✗ no slide with id "${id}"`);
      continue;
    }
    await page.evaluate((slideId) => window.agentSlides.reveal(slideId, window.agentSlides.steps(slideId)), id);
    await stage.scrollIntoViewIfNeeded();
    await stage.screenshot({ path: `.tmp/shots/${id}.png` });
    console.log(`  shot .tmp/shots/${id}.png`);
  }
}

await browser.close();
process.exit(overflowing.length || placeholders.length ? 1 : 0);
