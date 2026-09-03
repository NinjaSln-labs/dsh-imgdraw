# 部署纪律（本插件单库适用，硬性）

全文与事故背景见仓库根 `DEVELOPMENT.md`「部署纪律：profile 安装」，核心规则：

1. 改了本插件源码（`src/`、`scripts/`）未发版 → profile 必须以 `file:` 指向本目录安装，禁止留在 registry 安装（同版本号不同内容，版本校验失效）。
2. 安装一律走 `dsh plugin --profile web install`，禁裸 `npm install`。
3. 每次 install / build 后必跑：`npm run check:deploy`（本单库即一个插件，无需 --pkg；FAIL 必须修复）。
4. `file:` 场景禁止手动软链。

> 单库说明：本仓库 2026-09 从 dsh-plugins monorepo 迁出，仓库根即插件目录。monorepo 时代的根级 `pnpm-workspace.yaml` + `overrides`（多包防双实例护栏）**本单库不需要**（单一包非 workspace）；peer 版本兼容由宿主 dsh 决定，peerDependencies 如实声明即可。git 钩子在 `.githooks/`（启用：`git config core.hooksPath .githooks`）。