# 贡献指南

感谢你愿意为 dsh-imgdraw 贡献！本仓库是一个独立单库（2026-09 从 dsh-plugins monorepo 迁出），仓库根即插件目录。

## 开发环境

```sh
npm install --legacy-peer-deps   # peer 由宿主 dsh 在运行时提供，本仓库装 devDeps 供构建/类型检查
npm run build                    # tsc → lib/ + esbuild 客户端 bundle
npm run typecheck                # 严格类型检查
npm run mount                    # 挂载 smoke test（验证 tool/route 注册）
```

## 提交规范

- 提交信息用中文写清楚「改了什么 + 为什么」（仓库 AGENTS.md / DEVELOPMENT.md 有完整纪律）。
- 涉及 `src/`、`scripts/` 改动会触发 pre-commit 部署纪律自检（`git config core.hooksPath .githooks` 启用）；确属未部署的中间态用 `--no-verify` 并在说明中注明。
- **本机私有信息不入库**：本机绝对路径、个人邮箱、token、部署实况快照一律不写入入库文件。

## 发版流程

见 `.github/workflows/publish.yml`（OIDC Trusted Publishing）：npm version → tag → push → CI 自动验证+发布。
发布前需在 npmjs.com 配好 Trusted Publisher（`dsh-imgdraw` 包设置 → 指向 `NinjaSln-labs/dsh-imgdraw` 仓库的 `publish.yml`）。

## 行为准则

简单说：尊重、建设性、对事不对人。本仓库维护者会驳回不友善或与主题无关的 issue / PR。