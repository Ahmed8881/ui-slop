#!/usr/bin/env node
import { parseArgs } from "node:util";
import { readFile, writeFile } from "node:fs/promises";
import { scan } from "../src/scan.js";
import { text, markdown, badge } from "../src/report.js";

const USAGE = `Usage: ui-slop <path-or-url>... [options]

Scores how AI-generated a UI looks (0 = hand-made, 100 = pure slop)
and lists accessibility and safety issues.

Options:
  --json              print the result as JSON
  --markdown          print a Markdown report
  --badge <file>      also write an SVG score badge
  --max-score <n>     exit 1 if the score is above n
  --max-issues <n>    exit 1 if there are more than n issues
  -v, --version
  -h, --help

Exit codes: 0 ok, 1 over a limit, 2 usage or scan error.`;

const fail = (msg) => { console.error(`ui-slop: ${msg}`); process.exit(2); };

let args;
try {
  args = parseArgs({
    allowPositionals: true,
    options: {
      json: { type: "boolean" }, markdown: { type: "boolean" }, badge: { type: "string" },
      "max-score": { type: "string" }, "max-issues": { type: "string" },
      version: { type: "boolean", short: "v" }, help: { type: "boolean", short: "h" },
    },
  });
} catch (e) {
  fail(`${e.message}\n\n${USAGE}`);
}
const { values: o, positionals: targets } = args;

if (o.help) { console.log(USAGE); process.exit(0); }
if (o.version) { console.log(JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8")).version); process.exit(0); }
if (!targets.length) fail(`give a file, folder, or URL to scan\n\n${USAGE}`);

const limit = (name) => {
  if (o[name] === undefined) return Infinity;
  const n = Number(o[name]);
  if (o[name] === "" || !Number.isInteger(n) || n < 0) fail(`--${name} needs a whole number, got "${o[name]}"`);
  return n;
};
const maxScore = limit("max-score"), maxIssues = limit("max-issues");

let result;
try {
  result = await scan(targets);
} catch (e) {
  fail(e.message);
}
console.log(o.json ? JSON.stringify(result, null, 2) : o.markdown ? markdown(result) : text(result));
if (o.badge) await writeFile(o.badge, badge(result.score));
process.exit(result.score > maxScore || result.issues > maxIssues ? 1 : 0);
