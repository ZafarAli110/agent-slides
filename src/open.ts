// Opens the deck in the default browser. `bun run show` builds it, then runs this; `bun run dev` opens its local URL
// with it (macOS, Windows and Linux).
//
//   bun src/open.ts [file or URL]   (default: dist/index.html)
import { resolve } from "node:path";

const target = process.argv[2] ?? "dist/index.html";
const isUrl = /^https?:\/\//.test(target);
const opened = isUrl ? target : resolve(target);
if (!isUrl && !(await Bun.file(opened).exists())) {
  console.error(`${opened} does not exist yet: run bun run build first.`);
  process.exit(1);
}

let command: string[];
if (process.platform === "darwin") {
  command = ["open", opened];
} else if (process.platform === "win32") {
  command = ["cmd", "/c", "start", "", opened];
} else {
  command = ["xdg-open", opened];
}
Bun.spawn(command, { stdout: "ignore", stderr: "ignore" }).unref();
console.log(`Opened ${opened}`);
