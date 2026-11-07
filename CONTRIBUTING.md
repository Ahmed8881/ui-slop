# Contributing

1. Fork, branch, and open a pull request against `main`. Direct pushes are blocked.
2. `npm test` must pass. CI runs it on Linux and Windows, Node 20 and 22.
3. **No runtime dependencies.** ui-slop runs in other people's CI; every dependency is
   code they have to trust.
4. **A new rule needs evidence.** Add it to `src/rules.js` with a test case that it flags
   and a close-but-fine case it must not flag (`test/rules.test.js`). Then run it on a few
   real, well-made sites (`node bin/ui-slop.js https://...`). If it fires on them, it is a
   false positive: tighten it or make it an issue rule instead of a slop rule.
5. Slop rule weights must still sum to 100 (a test checks this).
6. If you change behavior, add a line to `CHANGELOG.md`.

Security issues: see `SECURITY.md`, not the issue tracker.
