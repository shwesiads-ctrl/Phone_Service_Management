# FixFlow release requirements

For every product upgrade:
- Update `src/config/release.json` with the version, release date, and accurate Myanmar and English release notes. About and the sidebar read this file.
- Keep `package.json`, the root package in `package-lock.json`, and release metadata versions consistent.
- Review `src/views/AboutView.tsx` for any changed features or usage instructions, and update the Myanmar and English GitHub README sections.
- Use `src/config/developer.ts` for developer contacts; do not duplicate or invent contact details, pricing or delivery promises.
- Preserve an existing installation's `data/` and `.security/`. Use isolated fixtures for tests.
- Run appropriate checks and build fresh frontend/server assets before packaging the ZIP. Exclude installed dependencies, recovery keys and saved credentials.

User instructions take priority over this file.
