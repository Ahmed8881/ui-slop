// Each rule is a regex run over whole files, so tags that span lines still match.
// "slop" rules add `weight` to the score once they hit at least `min` times (default 1);
// the weights sum to 100. "issue" rules are quality problems: listed, never scored.
// `distinct` counts different matched phrases toward `min`, not every hit.
// `unless` drops a hit when the line it is on also matches (e.g. outline removed but a ring added).

const FONTS = "Inter|Roboto|Arial|Helvetica|Poppins|Montserrat|Space Grotesk|DM Sans";
// Tailwind's purple / violet / indigo / fuchsia 300-700, the colors of the generated-page gradient
const PURPLE_HEX = "#(?:c4b5fd|a78bfa|8b5cf6|7c3aed|6d28d9|d8b4fe|c084fc|a855f7|9333ea|7e22ce|a5b4fc|818cf8|6366f1|4f46e5|4338ca|e879f9|d946ef)";

export const rules = [
  {
    id: "generic-font", kind: "slop", weight: 20,
    title: "Default AI font as the main typeface",
    fix: "Pair a display face with a body face that differ in structure: serif + sans, condensed + mono.",
    re: new RegExp(
      `font-family:\\s*['"]?(?:${FONTS})\\b` +
      `|family=(?:${FONTS.replaceAll(" ", "\\+")})\\b` +
      `|\\b(?:Inter|Roboto|Poppins|Montserrat|DM_Sans|Space_Grotesk)\\(\\s*\\{`, // next/font: Inter({ subsets })
      "g"),
  },
  {
    id: "purple-gradient", kind: "slop", weight: 20,
    title: "Purple-to-blue gradient",
    fix: "Derive the palette from the brand. Use a flat color or a subtle tinted surface instead.",
    re: new RegExp(`(?:linear|radial|conic)-gradient\\([^;{}]*(?:purple|violet|indigo|${PURPLE_HEX})|\\bfrom-(?:purple|violet|indigo|fuchsia)-\\d{2,3}\\b`, "gi"),
  },
  {
    id: "emoji-icon", kind: "slop", weight: 15, min: 2,
    title: "Emoji used as icons",
    fix: "Use one SVG icon set at one stroke width, with aria-hidden=\"true\".",
    // only an emoji that is a whole element (<span>🚀</span>) or an icon value; emoji in prose is content
    re: /(?:>\s*|\bicon\s*[:=]\s*\{?\s*["'`])[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]️?\s*(?=<|["'`])/gu,
  },
  {
    id: "cliche-copy", kind: "slop", weight: 15, min: 3, distinct: true,
    title: "Marketing cliché copy",
    fix: "Say what the product does for whom: \"Close the books in two days, not ten.\"",
    re: /\b(?:unlock the (?:full )?power|harness the power|revolutioni[sz]e|seamless(?:ly)?|elevate your|supercharge|built for the future|all-in-one platform|next-gen(?:eration)?|game-?changer|cutting-edge|to the next level|effortless(?:ly)?|streamline your)\b/gi,
  },
  {
    id: "gradient-text", kind: "slop", weight: 10,
    title: "Gradient text on headings",
    fix: "Use a solid color. Emphasize with weight, italic, or the accent on one word.",
    re: /\bbg-clip-text\b|background-clip:\s*text/gi,
  },
  {
    id: "tailwind-default", kind: "slop", weight: 10, min: 5,
    title: "Default Tailwind palette instead of your own tokens",
    fix: "Make your tokens the theme so bg-surface and text-muted exist and bg-indigo-500 does not.",
    re: /\b(?:bg|text|border|ring|from|via|to)-(?:slate|gray|zinc|neutral|indigo|violet|purple|blue)-\d{2,3}\b/g,
  },
  {
    id: "glassmorphism", kind: "slop", weight: 5, min: 2,
    title: "Glassmorphism blur cards",
    fix: "Use solid surfaces. If translucent, check 4.5:1 contrast on the worst background.",
    re: /\bbackdrop-blur(?:-\w+)?\b|backdrop-filter:\s*blur/gi,
  },
  {
    id: "rounded-everything", kind: "slop", weight: 5, min: 6,
    title: "Large radius on everything",
    fix: "Small radius (or none) on controls, at most a large radius on containers.",
    re: /\brounded-(?:2xl|3xl)\b|border-radius:\s*(?:[2-4]\d)px/g,
  },

  {
    id: "focus-removed", kind: "issue",
    title: "Focus outline removed without a visible replacement",
    fix: "Keep a :focus-visible style, e.g. outline: 2px solid var(--color-focus).",
    re: /outline:\s*(?:none|0)\b|\boutline-none\b/g,
    unless: /\bring-|box-shadow|outline:\s*\d+px|focus-visible:outline-\d/,
  },
  {
    id: "transition-all", kind: "issue",
    title: "transition: all",
    fix: "Transition only the properties that change, e.g. background-color and transform.",
    re: /transition:\s*all\b|\btransition-all\b/g,
  },
  {
    id: "img-alt", kind: "issue",
    title: "<img> without alt",
    fix: "Describe the image in alt, or use alt=\"\" when it is decorative.",
    re: /<img\b(?![^>]*\balt=)[^>]*>/gi,
  },
  {
    id: "img-size", kind: "issue",
    title: "<img> without width and height (layout shift)",
    fix: "Set width and height, or aspect-ratio in CSS.",
    re: /<img\b(?![^>]*\b(?:width|height|fill)\b)[^>]*>/gi,
  },
  {
    id: "div-click", kind: "issue",
    title: "Clickable div or span",
    fix: "Use <button> for actions and <a href> for navigation; they work with the keyboard.",
    re: /<(?:div|span|li)\b[^>]*\bon[cC]lick\b/g,
  },
  {
    id: "blank-rel", kind: "issue",
    title: "target=\"_blank\" without rel",
    fix: "Add rel=\"noopener noreferrer\".",
    re: /<a\b(?=[^>]*\btarget=["']?_blank)(?![^>]*\brel=)[^>]*>/gi,
  },
  {
    id: "html-sink", kind: "issue",
    title: "Unsafe HTML sink",
    fix: "Render untrusted data as text, or sanitize it with DOMPurify first.",
    re: /dangerouslySetInnerHTML|\.(?:inner|outer)HTML\s*=(?!=)|insertAdjacentHTML|\bv-html\b|\{@html\b/g,
  },
  {
    id: "client-secret", kind: "issue",
    title: "Secret in client code",
    fix: "Keep secret keys on the server. Anything in NEXT_PUBLIC_ / VITE_ ships to every visitor.",
    re: /\b(?:NEXT_PUBLIC|VITE|PUBLIC)_\w*(?:SECRET|PRIVATE|PASSWORD)\w*|\bsk_live_[0-9A-Za-z]{8,}/g,
  },
];

// Checked across all scanned files at once, not per match
export const reducedMotion = {
  id: "reduced-motion", kind: "issue",
  title: "Animations without prefers-reduced-motion",
  fix: "Wrap movement in @media (prefers-reduced-motion: no-preference), or use motion-safe: in Tailwind.",
  uses: /@keyframes|\banimation:|\banimate-\w|framer-motion|\bgsap\b/,
  handles: /prefers-reduced-motion|useReducedMotion|\bmotion-(?:safe|reduce):/,
};
