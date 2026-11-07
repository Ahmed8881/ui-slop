# ui-slop

**Does your UI look AI-generated?** One command gives you a score from 0 (hand-made)
to 100 (pure slop), every place that pulled it up, and how to fix each one.

```bash
npx ui-slop https://your-site.com
npx ui-slop src/
```

```
ui-slop 100/100  looks AI-generated
2 file(s) scanned

Slop (adds to the score)
 +20  generic-font  Default AI font as the main typeface (2)
        index.html:6  fonts.googleapis.com/css2?family=Inter:wght@400;700
        styles.css:1  body { font-family: Inter, sans-serif; }
        fix: Pair a display face with a body face that differ in structure: serif + sans, condensed + mono.
 +20  purple-gradient  Purple-to-blue gradient (2)
        index.html:10  class="hero bg-gradient-to-r from-purple-600 to-blue-500 rounded-3xl">
        fix: Derive the palette from the brand. Use a flat color or a subtle tinted surface instead.
 ...

Issues (not scored, worth fixing)
   -  img-alt  <img> without alt (1)
        index.html:20  <img src="dashboard.png">
        fix: Describe the image in alt, or use alt="" when it is decorative.
 ...
```

No install, no config, no dependencies. Works on any site and on source written in
HTML, CSS, React, Vue, Svelte, Astro, or Tailwind, whoever wrote it: you, Cursor,
Copilot, v0, Lovable, Bolt, or Claude.

## What it looks for

**Slop** is the set of defaults that makes generated UI recognizable at a glance.
Each rule adds its weight to the score once it fires; the weights sum to 100.

| Rule | Points | What it catches |
|---|---|---|
| `generic-font` | 20 | Inter, Roboto, Poppins, Montserrat, Space Grotesk, DM Sans, Arial as the main face |
| `purple-gradient` | 20 | The purple-to-blue hero gradient, in CSS or Tailwind |
| `emoji-icon` | 15 | Emoji standing in for icons (2+) |
| `cliche-copy` | 15 | "Unlock the power", "seamless", "supercharge"... (3+ different ones) |
| `gradient-text` | 10 | Gradient-filled headline text |
| `tailwind-default` | 10 | The stock Tailwind palette instead of your own tokens (5+) |
| `glassmorphism` | 5 | Backdrop-blur cards (2+) |
| `rounded-everything` | 5 | `rounded-2xl` / 20px+ radius on everything (6+) |

**Issues** are real defects that tend to ship with generated UI. They are listed but
do not change the score: removed focus outlines, `transition: all`, images without
`alt` or dimensions, clickable `<div>`s, `target="_blank"` without `rel`, unsafe HTML
sinks (`innerHTML`, `dangerouslySetInnerHTML`, `v-html`), secrets in client env
vars, and animation without `prefers-reduced-motion`.

| Score | Verdict |
|---|---|
| 0-19 | looks hand-made |
| 20-49 | some generic defaults |
| 50-100 | looks AI-generated |

For calibration: on the day of release Linear and Stripe scored 15, GitHub 0.

## In CI

```yaml
# .github/workflows/ui-slop.yml
name: ui-slop
on: pull_request
permissions:
  contents: read
jobs:
  ui-slop:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Ahmed8881/ui-slop@v0.1.0
        with:
          path: src
          max-score: 30   # fail the PR if the UI drifts generic
          max-issues: 0   # and on any accessibility or safety issue
```

The full report lands in the job summary. The score is available as
`steps.<id>.outputs.score`.

Or from the CLI anywhere:

```bash
npx ui-slop src --max-score 30 --max-issues 0   # exit 1 when over a limit
npx ui-slop src --json                           # machine-readable
npx ui-slop src --markdown                       # for PR comments
```

## Badge

```bash
npx ui-slop src --badge ui-slop.svg
```

Commit `ui-slop.svg` and add it to your README: `![ui-slop](ui-slop.svg)`.
Green under 20, amber under 50, red above.

## Limits

- It reads code, it does not render. A URL scan reads the HTML the server sends plus
  its stylesheets. Single-page apps that render everything in the browser show
  little; scan their source folder instead.
- Rules are patterns, so a hit is a prompt to look, not a verdict. A brand that
  really is purple will trip `purple-gradient`. That is fine: you know why.
- A low score means you avoided the clichés, not that the design is good.

## Fix what it finds

ui-slop tells you what looks generated. To have your coding agent build UI that
does not, use [ahmed-ui-craft](https://github.com/Ahmed8881/ahmed-ui-craft), a
Claude Code skill built on the same rules.

## Contributing

New rules are welcome when they come with evidence; see [CONTRIBUTING.md](CONTRIBUTING.md).
Security reports: [SECURITY.md](SECURITY.md).

## License

MIT
