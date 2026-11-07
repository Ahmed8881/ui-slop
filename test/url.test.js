import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { scan } from "../src/scan.js";

let server, base;
before(async () => {
  server = createServer((req, res) => {
    if (req.url === "/hydrated") {
      res.end("<html><body><p>Ledgers</p>\n<script>self.__next_f.push(['<span>🚀</span> seamless', 'el.innerHTML = x'])</script>\n<img src=a.png></body></html>");
      return;
    }
    const path = { "/": "index.html", "/styles.css": "styles.css" }[req.url];
    if (!path) { res.writeHead(404).end(); return; }
    res.end(readFileSync(`test/fixtures/sloppy/${path}`));
  });
  await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

test("a URL is scanned together with its stylesheets", async () => {
  const r = await scan([`${base}/`]);
  // index.html + styles.css; the Google Fonts link is external and fails offline or loads, either is fine
  assert.ok(r.files >= 2);
  const ids = r.findings.map((f) => f.id);
  assert.ok(ids.includes("transition-all"), "styles.css was not fetched");
  assert.ok(ids.includes("img-alt"));
});

test("inline scripts on a served page are ignored, line numbers kept", async () => {
  const r = await scan([`${base}/hydrated`]);
  assert.deepEqual(r.findings.map((f) => f.id).sort(), ["img-alt", "img-size"]);
  assert.equal(r.findings[0].hits[0].line, 3);
});

test("a page that does not load is an error", async () => {
  await assert.rejects(scan([`${base}/missing`]), /HTTP 404/);
});
