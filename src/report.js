const MAX_HITS = 5;

export const verdict = (score) =>
  score < 20 ? "looks hand-made" : score < 50 ? "some generic defaults" : "looks AI-generated";

const where = (h) => (h.line ? `${h.file}:${h.line}` : h.file);
const sections = (r) => [
  ["Slop (adds to the score)", r.findings.filter((f) => f.kind === "slop")],
  ["Issues (not scored, worth fixing)", r.findings.filter((f) => f.kind === "issue")],
];

export function text(r) {
  const out = [`ui-slop ${r.score}/100  ${verdict(r.score)}`, `${r.files} file(s) scanned${r.skipped ? `, ${r.skipped} skipped (over 1 MB)` : ""}`];
  for (const [heading, list] of sections(r)) {
    if (!list.length) continue;
    out.push("", heading);
    for (const f of list) {
      const tag = f.kind === "slop" ? (f.counted ? `+${f.weight}`.padStart(4) : "  +0") : "   -";
      out.push(`${tag}  ${f.id}  ${f.title} (${f.hits.length})`);
      for (const h of f.hits.slice(0, MAX_HITS)) out.push(`        ${where(h)}${h.snippet ? `  ${h.snippet}` : ""}`);
      if (f.hits.length > MAX_HITS) out.push(`        ...and ${f.hits.length - MAX_HITS} more`);
      out.push(`        fix: ${f.fix}`);
    }
  }
  if (!r.findings.length) out.push("", "Nothing found.");
  return out.join("\n");
}

const cell = (s) => s.replaceAll("|", "\\|").replaceAll("`", "'");

export function markdown(r) {
  const out = [`## ui-slop: ${r.score}/100, ${verdict(r.score)}`, "", `${r.files} file(s) scanned, ${r.issues} issue(s).`];
  for (const [heading, list] of sections(r)) {
    if (!list.length) continue;
    out.push("", `### ${heading}`, "", "| Rule | Hits | First hit | Fix |", "|---|---|---|---|");
    for (const f of list) {
      const pts = f.kind === "slop" ? ` (+${f.counted ? f.weight : 0})` : "";
      out.push(`| **${f.id}**${pts} | ${f.hits.length} | \`${cell(where(f.hits[0]))}\` | ${cell(f.fix)} |`);
    }
  }
  return out.join("\n");
}

// Text colors are white; each fill below is at least 4.5:1 against it.
export function badge(score) {
  const fill = score < 20 ? "#2e7d32" : score < 50 ? "#8a5300" : "#c62828";
  const value = `${score}/100`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="112" height="20" role="img" aria-label="ui-slop: ${value}">` +
    `<title>ui-slop: ${value}</title><rect width="54" height="20" fill="#444"/><rect x="54" width="58" height="20" fill="${fill}"/>` +
    `<g fill="#fff" font-family="Verdana,DejaVu Sans,sans-serif" font-size="11" text-anchor="middle">` +
    `<text x="27" y="14">ui-slop</text><text x="83" y="14">${value}</text></g></svg>\n`;
}
