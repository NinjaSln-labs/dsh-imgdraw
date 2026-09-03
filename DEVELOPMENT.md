# dsh-imgdraw 开发流程

> 本仓库是 `dsh-imgdraw` 的**独立单库**（2026-09 从 dsh-plugins monorepo 迁出），仓库根即插件目录。

## 构建

```bash
npm install --legacy-peer-deps   # peer 由宿主 dsh 在运行时提供，devDeps 供构建/类型检查
npm run build                    # tsc → lib/ + esbuild 客户端 bundle
npm run typecheck                # 严格类型检查
npm run mount                    # 挂载 smoke test（验证 tool/route 注册）
```

## 部署纪律：profile 安装

> 事故背景：本地改了源码并 build，但 profile 里装的仍是 registry 旧包——**同版本号、不同内容**，版本校验完全失效，行为错位极难排查。

### 统一规则

| 插件状态 | profile 安装方式 |
|---|---|
| 联调中（有未提交改动） | `file:` 指向本单库目录 |
| 已入库、未发版 | `file:` 指向本单库目录 |
| 已发版且本仓库 lib == 部署 lib | registry `^0.1.0` |

安装一律走官方入口：

```bash
dsh plugin --profile web install
```

### 装后自检（每次 install 后必跑）

```bash
npm run check:deploy     # 一键自检，FAIL 即非零退出码
```

check:deploy 检查三点：
1. 源码 lib 与部署 lib 一致（同版本号不同内容，硬拦截）
2. profile 内 `@deepseek-ai/` 只允许 cosmokit / schemastery（防宿主核心包阴影）
3. `file:` 安装为真实目录（非软链，防止 realpath 脱离宿主 fallback）

### 强制执行（git hook）

提交涉及 `src/`、`scripts/` 改动时自动触发 check:deploy，FAIL 拒绝提交。启用：

```bash
git config core.hooksPath .githooks
```

中间态确需跳过时用 `git commit --no-verify`，并在提交说明注明"未部署，部署前需自检"。

### 关键认知

- **版本号相同 ≠ 内容相同**：registry 包只在"发版→立即重装"闭环里可信；脱离闭环一律降级为 file: 直装
- peer 永远由宿主 dsh 提供（fallback 在 `~/.dsh/profiles/node_modules/@deepseek-ai/`），profile 内不装宿主核心包
- 单库无需 `pnpm-workspace.yaml` / `overrides`（单一包非 workspace）
- `file:` 场景禁止手动软链：Node 按 realpath 解析会脱离 profile 的宿主 fallback，报 `Cannot find package '@deepseek-ai/...'`