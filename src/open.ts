// Opens the built deck in the default browser. `bun run show` builds it, then runs this (macOS, Windows and Linux).
//
//   bun src/open.ts [file]   (default: dist/index.html)
import { resolve } from "node:path";

const file = resolve(process.argv[2] ?? "dist/index.html");
if (!(await Bun.file(file).exists())) {
  console.error(`${file} does not exist yet: run bun run build first.`);
  process.exit(1);
}

let command: string[];
if (process.platform === "darwin") {
  command = ["open", file];
} else if (process.platform === "win32") {
  command = ["cmd", "/c", "start", "", file];
} else {
  command = ["xdg-open", file];
}
Bun.spawn(command, { stdout: "ignore", stderr: "ignore" }).unref();
console.log(`Opened ${file}`);
