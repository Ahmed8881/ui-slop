import { readFile, readdir, stat } from "node:fs/promises";
import { extname, join } from "node:path";
import { rules, reducedMotion } from "./rules.js";

const EXTENSIONS = new Set([".html", ".htm", ".css", ".scss", ".js", ".jsx", ".ts", ".tsx", ".vue", ".svelte", ".astro", ".mdx"]);
const SKIP_DIRS = new Set(["node_modules", ".git", ".next", ".nuxt", ".svelte-kit", ".turbo", "coverage"]);
const MAX_BYTES = 1_000_000; // bigger files are bundles or vendored code, not UI someone wrote

// Folders are walked for UI source files; a file named directly is always scanned.
// Symlinks are skipped, so a link loop cannot hang the walk.
async function collectFiles(target) {
  if ((await stat(target)).isFile()) return [target];
  const files = [];
  for (const entry of await readdir(target, { withFileTypes: true })) {
    const path = join(target, entry.name);
    if (entry.isDirectory() && !SKIP_DIRS.has(entry.name)) files.push(...(await collectFiles(path)));
    else if (entry.isFile() && EXTENSIONS.has(extname(entry.name)) && !entry.name.includes(".min.")) files.push(path);
  }
  return files;
}

export async function readSources(target) {
  const sources = [];
  let skipped = 0;
  for (const file of await collectFiles(target)) {
    if ((await stat(file)).size > MAX_BYTES) { skipped++; continue; }
    sources.push({ name: file.replaceAll("\\", "/"), text: await readFile(file, "utf8") });
  }
  return { sources, skipped };
}

function lineAt(starts, index) {
  let lo = 0, hi = starts.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= index) lo = mid; else hi = mid - 1; }
  return lo;
}

// sources: [{ name, text }] -> { score, files, findings: [{ id, kind, title, fix, weight, counted, hits }] }
export function analyze(sources) {
  const hits = new Map(rules.map((r) => [r.id, []]));
  for (const { name, text } of sources) {
    const lines = text.split("\n");
    const starts = [0];
    for (let i = 0; i < text.length; i++) if (text[i] === "\n") starts.push(i + 1);
    for (const rule of rules) {
      for (const m of text.matchAll(rule.re)) {
        const n = lineAt(starts, m.index);
        if (rule.unless?.test(lines[n])) continue;
        // a short window around the match keeps minified one-line files readable
        const col = m.index - starts[n];
        const snippet = lines[n].slice(Math.max(0, col - 30), col + 70).trim();
        hits.get(rule.id).push({ file: name, line: n + 1, snippet });
      }
    }
  }

  const findings = rules
    .map((r) => {
      const h = hits.get(r.id);
      return { id: r.id, kind: r.kind, title: r.title, fix: r.fix, weight: r.weight ?? 0, counted: r.kind === "slop" && h.length >= (r.min ?? 1), hits: h };
    })
    .filter((f) => f.hits.length);

  const rm = reducedMotion;
  const animated = sources.find((s) => rm.uses.test(s.text));
  if (animated && !sources.some((s) => rm.handles.test(s.text))) {
    findings.push({ id: rm.id, kind: rm.kind, title: rm.title, fix: rm.fix, weight: 0, counted: false, hits: [{ file: animated.name, line: 0, snippet: "" }] });
  }

  const score = Math.min(100, findings.reduce((n, f) => n + (f.counted ? f.weight : 0), 0));
  const issues = findings.filter((f) => f.kind === "issue").reduce((n, f) => n + f.hits.length, 0);
  return { score, issues, files: sources.length, findings };
}

export async function scan(targets) {
  const sources = [];
  let skipped = 0;
  for (const t of targets) {
    const r = await readSources(t);
    sources.push(...r.sources);
    skipped += r.skipped;
  }
  return { ...analyze(sources), skipped };
}
