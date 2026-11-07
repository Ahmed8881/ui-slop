import { test } from "node:test";
import assert from "node:assert/strict";
import { scan } from "../src/scan.js";
import { text, markdown, badge, verdict } from "../src/report.js";

const sloppy = await scan(["test/fixtures/sloppy"]);

test("text report shows score, rules, locations, and fixes", () => {
  const out = text(sloppy);
  assert.match(out, new RegExp(`^ui-slop ${sloppy.score}/100`));
  assert.match(out, /\+20  generic-font/);
  assert.match(out, /test\/fixtures\/sloppy\/styles\.css:3/);
  assert.match(out, /fix: /);
});

test("markdown report is a table per section", () => {
  const out = markdown(sloppy);
  assert.match(out, /### Slop/);
  assert.match(out, /\| \*\*img-alt\*\* \| 1 \|/);
});

test("badge carries the score and an accessible label", () => {
  const svg = badge(42);
  assert.match(svg, /aria-label="ui-slop: 42\/100"/);
  assert.match(svg, /#8a5300/);
});

test("verdict bands", () => {
  assert.deepEqual([0, 19, 20, 49, 50, 100].map(verdict), [
    "looks hand-made", "looks hand-made", "some generic defaults", "some generic defaults", "looks AI-generated", "looks AI-generated",
  ]);
});
