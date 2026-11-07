// Rebuilds the README images from real ui-slop output, so they never drift from the rules.
// Usage: npm i --no-save playwright && npx playwright install chromium && node docs/make-images.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { scan } from "../src/scan.js";
import { verdict } from "../src/report.js";

const DEMO = { before: "docs/demo/generated.html", after: "docs/demo/handmade.html" };
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// 1. Terminal: the CLI's own output, one example hit per rule so it fits
const raw = execFileSync(process.execPath, ["bin/ui-slop.js", DEMO.before], { encoding: "utf8" }).trimEnd().split("\n");
const lines = ["$ npx ui-slop docs/demo/generated.html", ""];
let hitsShown = 0;
for (const l of raw) {
  if (/^ {0,3}[+-]/.test(l)) hitsShown = 0;
  const isHit = /^ {8}(?!fix:|\.\.\.)/.test(l);
  if (isHit && hitsShown++ > 0) continue;
  if (/^ {8}\.\.\./.test(l)) continue;
  lines.push(l.length > 100 ? l.slice(0, 99) + "…" : l);
}
const color = (l) =>
  l.startsWith("$") ? "#7ee787" : l.startsWith("ui-slop") ? "#ff7b72" : /^ {1,3}\+\d/.test(l) ? "#e3b341" :
  /^ {8}fix:/.test(l) ? "#8b949e" : /^(Slop|Issues)/.test(l) ? "#ffffff" : "#c9d1d9";
const LH = 20, PAD = 24, W = 940, H = PAD * 2 + 28 + lines.length * LH;
writeFileSync("docs/terminal.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="ui-slop output for an AI-generated landing page">\n` +
  `<rect width="${W}" height="${H}" rx="10" fill="#0d1117"/>\n` +
  ["#ff5f57", "#febc2e", "#28c840"].map((c, i) => `<circle cx="${PAD + i * 20}" cy="${PAD}" r="6" fill="${c}"/>`).join("") + "\n" +
  `<g font-family="ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="13.5" xml:space="preserve" style="white-space:pre">\n` +
  lines.map((l, i) => `<text xml:space="preserve" x="${PAD}" y="${PAD + 36 + i * LH}" fill="${color(l)}">${esc(l)}</text>`).join("\n") +
  `\n</g></svg>\n`);

// 2. Before / after: screenshot both demo pages and label each with its real score
const { chromium } = await import("playwright").catch(() => {
  console.error("Playwright is missing: npm i --no-save playwright && npx playwright install chromium");
  process.exit(1);
});
const browser = await chromium.launch();
const shot = async (file) => {
  const page = await browser.newPage({ viewport: { width: 1200, height: 760 } });
  await page.goto(new URL(`../${file}`, import.meta.url).href, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const png = (await page.screenshot()).toString("base64");
  await page.close();
  return png;
};
const panel = async (label, file) => {
  const { score } = await scan([file]);
  const tone = score < 20 ? "#2e7d32" : score < 50 ? "#8a5300" : "#c62828";
  return `<figure><figcaption><span>${label}</span><b style="background:${tone}">ui-slop ${score}/100</b><i>${verdict(score)}</i></figcaption>` +
    `<img src="data:image/png;base64,${await shot(file)}" alt=""></figure>`;
};
const html = `<!doctype html><meta charset="utf-8"><style>
  body { margin: 0; padding: 32px; background: #e9e6e1; font: 16px system-ui, sans-serif; display: flex; gap: 28px; }
  figure { margin: 0; flex: 1; }
  figcaption { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; color: #1f1a17; }
  figcaption span { font-weight: 600; font-size: 18px; }
  figcaption b { color: #fff; padding: 4px 10px; border-radius: 4px; font: 600 15px ui-monospace, Consolas, monospace; }
  figcaption i { font-style: normal; color: #5c534c; }
  img { width: 100%; display: block; border-radius: 6px; box-shadow: 0 1px 0 rgba(0,0,0,.08), 0 12px 32px rgba(0,0,0,.12); }
</style>${await panel("Before", DEMO.before)}${await panel("After", DEMO.after)}`;
const page = await browser.newPage({ viewport: { width: 1600, height: 600 }, deviceScaleFactor: 1.5 });
await page.setContent(html);
await page.screenshot({ path: "docs/before-after.png", fullPage: true });
await browser.close();
console.log("wrote docs/terminal.svg and docs/before-after.png");
