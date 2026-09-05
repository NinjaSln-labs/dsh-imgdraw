# Scaffold Update 报告（2026-09-05T07:05:19.533Z，dsh-plugin）

- 回滚：git revert 9ee27692bc75d049c30d6b3d44f3ab25117d8407
- 冲突 8 项：.scaffold/conflicts/（交 agent 按 generate-validate-retry 处理）

## 文件清单

- **UNCHANGED** `.githooks/pre-commit` — 与模板一致
- **UNCHANGED** `.github/copilot-instructions.md` — 与模板一致
- **MERGE-REVIEW** `.github/workflows/ci.yml` — adopt 首见差异→.scaffold-merge/
- **MERGE-REVIEW** `.github/workflows/publish.yml` — adopt 首见差异→.scaffold-merge/
- **MERGE-REVIEW** `.gitignore` — adopt 首见差异→.scaffold-merge/
- **MERGE-REVIEW** `AGENTS.md` — adopt 首见差异→.scaffold-merge/
- **UNCHANGED** `CLAUDE.md` — 与模板一致
- **MERGE-REVIEW** `CONTRIBUTING.md` — adopt 首见差异→.scaffold-merge/
- **MERGE-REVIEW** `DEVELOPMENT.md` — adopt 首见差异→.scaffold-merge/
- **SKIP** `LICENSE` — 用户接管
- **MERGE-REVIEW** `PUBLISHING.md` — adopt 首见差异→.scaffold-merge/
- **SKIP** `README.en.md` — 用户接管
- **SKIP** `README.md` — 用户接管
- **MERGE-REVIEW** `SECURITY.md` — adopt 首见差异→.scaffold-merge/
- **SKIP** `package.json` — 用户接管
- **UNCHANGED** `scripts/build.mjs` — 与模板一致
- **UNCHANGED** `scripts/check-deploy.mjs` — 与模板一致
- **UNCHANGED** `scripts/verify.mjs` — 与模板一致
- **SKIP** `src/config.ts` — 用户接管
- **SKIP** `src/index.ts` — 用户接管
- **UNCHANGED** `tsconfig.build.json` — 与模板一致
- **UNCHANGED** `tsconfig.json` — 与模板一致
