# Security

Report vulnerabilities privately through GitHub:
**Security → Report a vulnerability** on this repo. Do not open a public issue.

In scope: the CLI (`bin/`, `src/`), the GitHub Action (`action.yml`, `action/`), and the
CI workflow. ui-slop reads the files and URLs you give it and runs in other people's
CI, so anything that lets a scanned file or page execute code, read files outside the
given paths, or leak secrets is a vulnerability.

You will get a reply within 7 days. Only the latest release is supported.
