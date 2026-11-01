// Exports a built deck to PowerPoint or PDF. Each slide becomes a picture of the HTML slide, and a slide with reveal
// steps becomes one page per step, so the build-up survives the export. Speaker notes go to PowerPoint's notes pane.
// The HTML deck stays the source: rebuild the export, never edit it.
//
//   bun src/export.ts pptx [dist/index.html] [--final]      → dist/deck.pptx
//   bun src/export.ts pdf  [dist/index.html] [--final]      → dist/deck.pdf
//
// --final: one page per slide, with every step shown.

import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import PptxGenJS from "pptxgenjs";

interface Picture {
  title: string;
  notes: string;
  png: Buffer;
}

const [format, ...rest] = process.argv.slice(2);
const final = rest.includes("--final");
const target = resolve(rest.find((arg) => !arg.startsWith("--")) ?? "dist/index.html");
if (format !== "pptx" && format !== "pdf") {
  console.error("Usage: bun src/export.ts pptx|pdf [dist/index.html] [--final]");
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1316, height: 756 }, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(target).href);
await page.evaluate(() => document.fonts.ready);
await page.addStyleTag({ content: ".navhint,.hud,.progress{display:none!important}.rv{transition:none!important}" });

const deckTitle = await page.title();
const slides = await page.$$eval(".slide", (els) => els.map((el) => ({
  id: el.id,
  title: (el.querySelector("h1, h2")?.textContent ?? el.id).trim(),
  notes: (el.querySelector(".slide-notes")?.textContent ?? "").trim(),
})));

// One picture per step: steps 0..n for a reveal slide (0 = nothing revealed yet), or just the full slide.
const pictures: Picture[] = [];
for (const slide of slides) {
  const steps = await page.evaluate((id) => window.agentSlides.steps(id), slide.id);
  const from = final || steps === 0 ? steps : 0;
  for (let step = from; step <= steps; step += 1) {
    await page.evaluate(([id, n]) => window.agentSlides.reveal(id, n), [slide.id, step] as const);
    const stage = page.locator(`[id="${slide.id}"] .stage`);
    await stage.scrollIntoViewIfNeeded();
    pictures.push({ title: slide.title, notes: slide.notes, png: await stage.screenshot({ animations: "disabled" }) });
  }
}

const out = resolve(dirname(target), `deck.${format}`);
if (format === "pptx") {
  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_WIDE"; // 13.33 × 7.5 in, the deck's 16:9
  pres.title = deckTitle;
  for (const picture of pictures) {
    const slide = pres.addSlide();
    slide.addImage({ data: `image/png;base64,${picture.png.toString("base64")}`, x: 0, y: 0, w: "100%", h: "100%", altText: picture.title });
    if (picture.notes) {
      slide.addNotes(picture.notes);
    }
  }
  await pres.writeFile({ fileName: out });
} else {
  const pdfPage = await browser.newPage();
  const pages = pictures.map((picture) => `<img src="data:image/png;base64,${picture.png.toString("base64")}" alt="">`).join("");
  await pdfPage.setContent(`<style>@page{size:1280px 720px;margin:0}body{margin:0}img{display:block;width:1280px;height:720px;break-after:page}</style>${pages}`, { waitUntil: "load" });
  await Bun.write(out, await pdfPage.pdf({ width: "1280px", height: "720px", printBackground: true }));
}

await browser.close();
console.log(`Wrote ${pictures.length} pages (${slides.length} slides) to ${out}`);
