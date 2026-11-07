import { test } from "node:test";
import assert from "node:assert/strict";
import { rules } from "../src/rules.js";

// For every rule: text it must flag, and close-but-fine text it must not.
const cases = {
  "generic-font": {
    yes: ["body { font-family: Inter, sans-serif; }", "<link href=\"https://fonts.googleapis.com/css2?family=Space+Grotesk\">", "const inter = Inter({ subsets: ['latin'] })"],
    no: ["body { font-family: 'Fraunces', Arial, serif; }", "import { Fraunces } from 'next/font/google'"],
  },
  "purple-gradient": {
    yes: ["background: linear-gradient(135deg, #6366f1, #3b82f6);", "class=\"bg-gradient-to-r from-purple-600 to-blue-500\"", "background: radial-gradient(circle, violet, blue)"],
    no: ["background: linear-gradient(#fff, #f4f1ea);", "class=\"from-amber-500\""],
  },
  "emoji-icon": {
    yes: ["<span>🚀</span>", "<div class=\"icon\">\n  ✨\n</div>", "{ title: 'Fast', icon: '⚡' }", "<Feature icon=\"🔒\" />"],
    no: ["<svg aria-hidden=\"true\"></svg>", "<p>🍺 The Package Manager for Everywhere</p>", "Ship it 🚀 today"],
  },
  "cliche-copy": {
    yes: ["Unlock the power of your data", "A seamless experience", "Supercharge your workflow"],
    no: ["Close the books in two days, not ten."],
  },
  "gradient-text": { yes: ["class=\"bg-clip-text text-transparent\"", "-webkit-background-clip: text;"], no: ["background-clip: padding-box;"] },
  "tailwind-default": { yes: ["bg-indigo-500", "text-slate-700"], no: ["bg-surface text-muted", "bg-indigo"] },
  "glassmorphism": { yes: ["backdrop-blur-md", "backdrop-filter: blur(12px)"], no: ["filter: blur(2px)"] },
  "rounded-everything": { yes: ["rounded-2xl", "border-radius: 24px"], no: ["rounded-md", "border-radius: 4px"] },
  "focus-removed": {
    yes: ["button:focus { outline: none; }", "class=\"outline-none\""],
    no: ["class=\"focus-visible:outline-none focus-visible:ring-2\"", "outline: 2px solid var(--focus);"],
  },
  "transition-all": { yes: ["transition: all .3s", "class=\"transition-all\""], no: ["transition: opacity 150ms"] },
  "img-alt": { yes: ["<img src=\"a.png\">", "<img\n  src={src}\n  width={10}\n/>"], no: ["<img src=\"a.png\" alt=\"\">", "<img\n  src={src}\n  alt=\"Chart\"\n/>"] },
  "img-size": { yes: ["<img src=\"a.png\" alt=\"\">"], no: ["<img src=\"a.png\" alt=\"\" width=\"10\" height=\"10\">", "<Image fill src={s} />"] },
  "div-click": { yes: ["<div onClick={save}>", "<span onclick=\"go()\">"], no: ["<button onClick={save}>"] },
  "blank-rel": {
    yes: ["<a href=\"x\" target=\"_blank\">"],
    no: ["<a href=\"x\" target=\"_blank\" rel=\"noopener noreferrer\">", "<a rel=\"noopener\" target=\"_blank\" href=\"x\">"],
  },
  "html-sink": { yes: ["el.innerHTML = msg", "<div v-html=\"body\">", "{@html post}"], no: ["el.textContent = msg", "if (el.innerHTML === '')"] },
  "client-secret": { yes: ["process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY", "VITE_DB_PASSWORD"], no: ["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"] },
};

const hit = (rule, s) => [...s.matchAll(rule.re)].some((m) => {
  const line = s.split("\n").find((l) => l.includes(m[0].split("\n")[0])) ?? "";
  return !rule.unless?.test(line);
});

test("every rule has test cases", () => {
  assert.deepEqual(rules.map((r) => r.id).sort(), Object.keys(cases).sort());
});

test("slop weights sum to 100", () => {
  assert.equal(rules.filter((r) => r.kind === "slop").reduce((n, r) => n + r.weight, 0), 100);
});

for (const rule of rules) {
  test(rule.id, () => {
    for (const s of cases[rule.id].yes) assert.ok(hit(rule, s), `should flag: ${s}`);
    for (const s of cases[rule.id].no) assert.ok(!hit(rule, s), `should not flag: ${s}`);
  });
}
