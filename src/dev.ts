// Live preview while you write: builds the deck, serves it on localhost, opens it in your browser, then rebuilds and
// reloads the page whenever slides.ts, src/ or assets/ change. The page stays on the slide you were on.
//
//   bun run dev                 http://localhost:4300   (PORT=4301 bun run dev for another port; --no-open to serve only)
//
// Ctrl-C stops it. dist/index.html is the same file `bun run build` writes; the reload script is added only when it is
// served here, never written into the file you present or share.
import { existsSync, readdirSync, statSync, watch } from "node:fs";

const port = Number(process.env["PORT"] ?? 4300);
const outFile = "dist/index.html";
const encoder = new TextEncoder();
const pages = new Set<ReadableStreamDefaultController<Uint8Array>>();
const SOURCES = ["slides.ts", "src", "assets"];

/**
 * The sources' latest modified time. macOS also reports a read (the build importing slides.ts) as a change, so a
 * rebuild only happens when this has really moved.
 */
function sourcesModifiedMs(): number {
  let latest = 0;
  const visit = (path: string): void => {
    const stats = statSync(path);
    latest = Math.max(latest, stats.mtimeMs);
    if (stats.isDirectory()) {
      for (const name of readdirSync(path)) {
        visit(`${path}/${name}`);
      }
    }
  };
  for (const source of SOURCES) {
    if (existsSync(source)) {
      visit(source);
    }
  }
  return latest;
}
let builtFromMs = sourcesModifiedMs();

const reloadScript = `<script>new EventSource("/__reload").onmessage = () => location.reload();</script>`;

async function buildAsync(): Promise<boolean> {
  const build = Bun.spawn(["bun", "src/build.ts"], {
    stdout: "inherit",
    stderr: "inherit",
  });
  return (await build.exited) === 0;
}

function reloadPages(): void {
  for (const page of pages) {
    page.enqueue(encoder.encode("data: reload\n\n"));
  }
}

if (!(await buildAsync())) {
  console.error(
    "The first build failed: fix slides.ts, then run bun run dev again.",
  );
  process.exit(1);
}

Bun.serve({
  port,
  idleTimeout: 0, // the reload stream stays open as long as the page does
  async fetch(request) {
    if (new URL(request.url).pathname === "/__reload") {
      let page: ReadableStreamDefaultController<Uint8Array> | null = null;
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          page = controller;
          pages.add(controller);
        },
        cancel() {
          if (page) {
            pages.delete(page);
          }
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    }
    const html = await Bun.file(outFile).text();
    return new Response(html.replace("</body>", `${reloadScript}</body>`), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },
});

// Several saves arrive as several events: wait until they stop, then build once.
let pending: ReturnType<typeof setTimeout> | null = null;
function onChange(): void {
  if (pending) {
    clearTimeout(pending);
  }
  pending = setTimeout(async () => {
    pending = null;
    if (sourcesModifiedMs() === builtFromMs) {
      return;
    }
    builtFromMs = sourcesModifiedMs();
    if (await buildAsync()) {
      reloadPages();
    } else {
      console.error(
        "Build failed: the page keeps the last good version until you fix it.",
      );
    }
  }, 150);
}
for (const path of SOURCES) {
  if (existsSync(path)) {
    watch(path, { recursive: true }, onChange);
  }
}

const url = `http://localhost:${port}`;
console.log(
  `Serving ${url} and watching slides.ts, src/ and assets/. Ctrl-C stops it.`,
);
// --no-open serves without opening a browser (for a check from a script).
if (!process.argv.includes("--no-open")) {
  Bun.spawn(["bun", "src/open.ts", url], {
    stdout: "inherit",
    stderr: "inherit",
  });
}
