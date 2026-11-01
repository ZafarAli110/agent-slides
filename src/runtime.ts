// agent-slides runtime: runs in the browser, inlined into the built deck by src/build.ts (its types are stripped).
// Navigation, reveal steps, speaker notes, the shortcut bar, and shrinking an overfull slide a little to fit.

interface AgentSlides {
  steps: (id: string) => number;
  reveal: (id: string, n: number) => void;
}

declare global {
  interface Window {
    agentSlides: AgentSlides;
  }
}

const slides = [...document.querySelectorAll<HTMLElement>(".slide")];
const progress = document.getElementById("progress");
const notesPanel = document.getElementById("notesPanel");
const helpPanel = document.getElementById("helpPanel");

// Fit: if a slide's content is a little too big for its stage, zoom it down (never below 88%). The checker
// (src/check.ts) measures before this runs, so a deck does not quietly shrink until it is unreadable.
function fitSlides(): void {
  document.querySelectorAll<HTMLElement>(".stage main").forEach((main) => {
    main.style.zoom = "";
    let zoom = 1;
    while ((main.scrollHeight > main.clientHeight + 2 || main.scrollWidth > main.clientWidth + 2) && zoom > 0.88) {
      zoom -= 0.02;
      main.style.zoom = String(zoom);
    }
  });
}
void document.fonts.ready.then(fitSlides);
let resizeTimer: ReturnType<typeof setTimeout> | undefined;
addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(fitSlides, 150);
});

// Reveal: on a slide marked `reveal: true`, these parts appear one per key press, in page order.
const REVEALABLE = [
  ".explain-points > article", ".split li", ".sequence > li", ".demo-steps > li", ".demo-rule", "tbody > tr",
  ".checklist > li", ".exercise li", ".shots > figure", ".explain-takeaway", ".slide-note",
].join(",");
const items = (slide: HTMLElement): HTMLElement[] => (slide.hasAttribute("data-reveal") ? [...slide.querySelectorAll<HTMLElement>(REVEALABLE)] : []);
const shown = new Map<HTMLElement, number>(slides.map((slide) => [slide, 0]));
const apply = (slide: HTMLElement): void => {
  const count = shown.get(slide) ?? 0;
  items(slide).forEach((item, index) => {
    item.classList.add("rv");
    item.classList.toggle("rv-hidden", index >= count);
  });
};
slides.forEach(apply);

const current = (): number => slides.reduce((best, slide, index) => {
  const distance = Math.abs(slide.getBoundingClientRect().top);
  return distance < best.distance ? { index, distance } : best;
}, { index: 0, distance: Infinity }).index;

const go = (index: number): HTMLElement | undefined => {
  const slide = slides[Math.max(0, Math.min(slides.length - 1, index))];
  slide?.scrollIntoView({ block: "start" });
  return slide;
};

function next(): void {
  const slide = slides[current()];
  if (!slide) {
    return;
  }
  const count = shown.get(slide) ?? 0;
  if (count < items(slide).length) {
    shown.set(slide, count + 1);
    apply(slide);
    return;
  }
  const target = go(current() + 1);
  if (target && target !== slide) {
    shown.set(target, 0);
    apply(target);
  }
}

function back(): void {
  const slide = slides[current()];
  if (!slide) {
    return;
  }
  const count = shown.get(slide) ?? 0;
  if (count > 0) {
    shown.set(slide, count - 1);
    apply(slide);
    return;
  }
  const target = go(current() - 1);
  if (target && target !== slide) {
    shown.set(target, items(target).length);
    apply(target);
  }
}

// Speaker notes: N shows the current slide's notes in a panel at the bottom of the screen, never on the slide.
function showNotes(): void {
  if (!notesPanel || !document.body.classList.contains("notes-on")) {
    return;
  }
  const notes = slides[current()]?.querySelector(".slide-notes");
  notesPanel.innerHTML = notes ? notes.innerHTML : "<em>No notes for this slide.</em>";
  notesPanel.scrollTop = 0;
}

function goTo(target: string): void {
  const slide = document.getElementById(target) ?? document.querySelector(`.slide[data-part="${target}"]`);
  slide?.scrollIntoView({ block: "start" });
}

addEventListener("keydown", (event: KeyboardEvent) => {
  if (event.metaKey || event.ctrlKey || event.altKey) {
    return;
  }
  const key = event.key.toLowerCase();
  if (["arrowright", "pagedown", " "].includes(key)) {
    event.preventDefault();
    next();
  }
  if (["arrowleft", "pageup"].includes(key)) {
    event.preventDefault();
    back();
  }
  if (key === "home") {
    go(0);
  }
  if (key === "end") {
    go(slides.length - 1);
  }
  if (key === "o") {
    goTo(document.querySelector<HTMLElement>(".hud [data-go]")?.dataset.go ?? "");
  }
  if (key === "?") {
    helpPanel?.classList.toggle("show");
  }
  if (key === "escape") {
    helpPanel?.classList.remove("show");
  }
  if (key === "n") {
    document.body.classList.toggle("notes-on");
    showNotes();
  }
  if (key === "h") {
    document.body.classList.toggle("hide-chrome");
  }
});

let notesTimer: ReturnType<typeof setTimeout> | undefined;
addEventListener("scroll", () => {
  clearTimeout(notesTimer);
  notesTimer = setTimeout(showNotes, 120);
  const max = document.documentElement.scrollHeight - innerHeight;
  if (progress) {
    progress.style.width = `${max ? (scrollY / max) * 100 : 0}%`;
  }
}, { passive: true });

document.querySelectorAll<HTMLElement>("[data-go]").forEach((button) => {
  button.addEventListener("click", () => goTo(button.dataset.go ?? ""));
});
document.getElementById("help")?.addEventListener("click", () => helpPanel?.classList.toggle("show"));
document.getElementById("hintclose")?.addEventListener("click", () => document.body.classList.add("hide-chrome"));

// For the checker and the exporter: how many reveal steps a slide has, and show the first n of them.
window.agentSlides = {
  steps: (id) => {
    const slide = document.getElementById(id);
    return slide ? items(slide).length : 0;
  },
  reveal: (id, n) => {
    const slide = document.getElementById(id);
    if (slide) {
      shown.set(slide, n);
      apply(slide);
    }
  },
};

export {};
