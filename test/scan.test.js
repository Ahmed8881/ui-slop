import { test } from "node:test";
import assert from "node:assert/strict";
import { scan, analyze } from "../src/scan.js";

const ids = (r) => r.findings.map((f) => f.id).sort();

test("sloppy page scores high and lists its issues", async () => {
  const r = await scan(["test/fixtures/sloppy"]);
  assert.equal(r.files, 2);
  assert.ok(r.score >= 80, `score ${r.score}`);
  for (const id of ["generic-font", "purple-gradient", "emoji-icon", "cliche-copy", "img-alt", "div-click", "blank-rel", "focus-removed", "transition-all", "reduced-motion"]) {
    assert.ok(ids(r).includes(id), `missing ${id}`);
  }
});

test("clean page scores 0 with no issues", async () => {
  const r = await scan(["test/fixtures/clean"]);
  assert.deepEqual({ score: r.score, issues: r.issues, findings: ids(r) }, { score: 0, issues: 0, findings: [] });
});

test("hits carry file and line", async () => {
  const r = await scan(["test/fixtures/sloppy/styles.css"]);
  const hit = r.findings.find((f) => f.id === "transition-all").hits[0];
  assert.deepEqual([hit.file, hit.line], ["test/fixtures/sloppy/styles.css", 3]);
});

test("long lines are cut around the match and marked", () => {
  const r = analyze([{ name: "a.css", text: `${"x".repeat(200)} transition: all 1s; ${"y".repeat(200)}` }]);
  const { snippet } = r.findings[0].hits[0];
  assert.match(snippet, /^…x+ transition: all 1s; y+…$/);
});

test("a slop rule below its minimum is listed but not scored", () => {
  const r = analyze([{ name: "a.html", text: "<span>🚀</span>" }]);
  assert.equal(r.score, 0);
  assert.equal(r.findings[0].counted, false);
});

test("cliche copy scores only with 3 different phrases", () => {
  const one = analyze([{ name: "a.html", text: "<p>Seamless.</p><p>Seamless.</p><p>Seamless.</p><p>seamless</p>" }]);
  const three = analyze([{ name: "a.html", text: "<p>Seamless. Supercharge. Cutting-edge.</p>" }]);
  assert.deepEqual([one.score, three.score], [0, 15]);
});

test("reduced-motion is satisfied by any file", () => {
  const r = analyze([
    { name: "a.css", text: "@keyframes x {}" },
    { name: "b.css", text: "@media (prefers-reduced-motion: reduce) {}" },
  ]);
  assert.equal(r.issues, 0);
});
