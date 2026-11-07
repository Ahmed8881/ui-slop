# Changelog

## Unreleased

- README with a real before/after: demo pages in `docs/demo/`, images rebuilt by `docs/make-images.mjs`.
- Long snippets show `…` where they were cut.

## 0.1.0 - 2026-11-07

First release.

- `ui-slop <path-or-url>`: slop score 0-100 from 8 weighted rules, plus 9 issue rules
  for accessibility, performance, and safety defects.
- Scans folders of HTML, CSS, JS/TS, JSX/TSX, Vue, Svelte, Astro, and MDX, or a live URL
  with its stylesheets.
- Text, `--json`, and `--markdown` output; `--badge` writes an SVG score badge.
- `--max-score` and `--max-issues` exit 1 when over a limit.
- GitHub Action with a job summary and `score` / `issues` outputs.
