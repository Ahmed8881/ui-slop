import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const run = (...args) => spawnSync(process.execPath, ["bin/ui-slop.js", ...args], { encoding: "utf8" });

test("prints a text report and exits 0 without limits", () => {
  const r = run("test/fixtures/sloppy");
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^ui-slop 100\/100/);
});

test("exits 1 when over --max-score or --max-issues", () => {
  assert.equal(run("test/fixtures/sloppy", "--max-score", "50").status, 1);
  assert.equal(run("test/fixtures/sloppy", "--max-issues", "0").status, 1);
  assert.equal(run("test/fixtures/clean", "--max-score", "0", "--max-issues", "0").status, 0);
});

test("--json is parseable and --badge writes an SVG", () => {
  const badge = join(mkdtempSync(join(tmpdir(), "ui-slop-")), "badge.svg");
  const r = run("test/fixtures/clean", "--json", "--badge", badge);
  assert.equal(JSON.parse(r.stdout).score, 0);
  assert.match(readFileSync(badge, "utf8"), /ui-slop: 0\/100/);
});

test("usage errors exit 2", () => {
  assert.equal(run().status, 2);
  assert.equal(run("test/fixtures/clean", "--max-score", "abc").status, 2);
  assert.equal(run("test/fixtures/clean", "--nope").status, 2);
  assert.equal(run("does/not/exist").status, 2);
});

test("--version matches package.json", () => {
  assert.equal(run("--version").stdout.trim(), JSON.parse(readFileSync("package.json", "utf8")).version);
});
