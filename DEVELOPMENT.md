# dsh-imgdraw 开发流程

> 本仓库是 `dsh-imgdraw` 的**独立单库**（2026-09 从 `dsh-plugins` monorepo 迁出），仓库根即插件目录。
> 通用的**开发 → 验证 → 构建 → 发布**规范（人与 agent 均按此执行）；流程模型的团队变体
> （如敏捷迭代）由分类 append 或团队自行补充。原则：**小步提交、每步可验证、事实落盘**。
> 本文件由模板单源拼装（common/DEVELOPMENT-core.md + 分类 append）——重复段勿手改。

## 1. 开发（Develop）

- **动手前**：明确要做的一件事（功能/缺陷/技术债），用户故事格式更佳——`作为 <用户>，我想要 <能力>，以便 <收益>`
- **契约预检**：用依赖方/宿主的检查工具查清要用的 API/接口**精确签名**——不猜（格式错误运行时才发现 = 一个迭代白做）
- **实现规范**：见下方「分类纪律」节（语言/宿主专属硬规则）
- **边界条件**：空输入 / 并发 / 超时 / 取消 / 重启恢复，设计时想过、测试里覆盖

## 2. 验证（Verify）

**验证链单源**（命令见 AGENTS.md / CONTRIBUTING.md 的分类纪律节；本地与 CI 同一入口）：

- 提交前本地全绿；FAIL 修根因，不绕过（`--no-verify` 必须留痕注明）
- **实机/实测验收**：部署到本机或测试环境真实跑一遍用户路径；无运行中验证 = 未做完
- 机密自查：`git grep` 本仓既定模式（本机路径/邮箱/token），见 AGENTS.md 机密红线

## 3. 构建与文档（Build & Document）

- 构建产物不入库（CI 从源码重建）；锁文件必须入库（CI 复现依赖）
- 文档同步：行为/接口变化同步 README 与等价设计文档；新坑进速查表（见附录机制）
- CHANGELOG / 版本历史（如有）：每版一行「做了什么 + 为什么 + 怎么验证的」

## 4. 发布（Release）

- 发布是显式人工决策（tag / Release PR 合并）；流程见 [PUBLISHING.md](PUBLISHING.md)
- 发布后验证：确认 latest 更新、provenance/attestations（按通道）、实机重装路径走一遍

## 5. 反馈与沉淀（Feedback）

- 用户的每个反馈都登记：满意点 / 不满意点 / 建议——不满意点优先转成待办缺陷条目
- **复盘三问**（答案落盘）：① 这次什么顺利？② 这次踩了什么坑（新坑 → 立即进速查表）？
  ③ 同类坑重复出现 ≥2 次？是 = 流程缺陷，先补流程再继续

## 分类纪律：dsh 插件实现规范

- host 侧 TypeScript（tsc → lib/），client 侧 TSX 经 esbuild 打 bundle
- **动态 Cordis 插件代码沙箱禁用全局**：`setTimeout/setInterval/...`（用 `ctx.timeout/ctx.interval`，`inject: ['timer']`）、`fetch`（用 `ctx.web`）、`process/Buffer`（用 btoa/atob/TextEncoder）、`require`（用服务）。
  > 本仓库是**正式 bundle**：host half 跑在宿主 Node 进程内，Node 原生 `fetch` / `Buffer` 可用（`generate.ts` 即用 Node fetch 调第三方图像 API）；上述沙箱限制只约束动态插件定义代码。
- 服务访问：`ctx.get(name)` + undefined 检查；硬依赖才 `inject`
  > **bundle 内任何可选服务一律 `ctx.inject()` 等待**，不要在 apply 顶层 `ctx.get()` 后作 `if` 跳过——
  > bundle 在 boot 早期 apply，此时 `webServer` 尚未激活，`ctx.get` 拿到 undefined 会**静默跳过**整块注册
  > （工具注册用 `ctx.inject(['tools'])` 会等待，路由却用 `ctx.get` 就分叉，极具迷惑性）。
- 动态工具：`harness.defineTool()` 包装后再 `harness.registerTool(ctx, tool)`；`parameters` 根省略 `additionalProperties`
- **每次 define 显式提供 `code.host` 和 `code.client`**（省略 client = UI 消失，踩过 4 次）
- append 事件格式：先查系统同类事件再写（source/id/surfaceOp 对齐）

## 分类 DoD 补充（dsh 插件）

- [ ] `cordis_inspect_self`：state=running，**hasHostHalf 与 hasClientHalf 均为 true**
- [ ] 无沙箱禁用全局（grep setTimeout/fetch/require/process/Buffer——bundle host half 的 Node 原生调用例外，见上）
- [ ] 客户端无 `client-render` 诊断；工具注册确认
- [ ] 会话日志无 command/done error；状态文件按预期生成

## 部署纪律：profile 安装（事故沉淀）

> 事故：本地改了源码并 build，但 profile 里装的仍是 registry 旧版——**同版本号、不同内容**，版本校验完全失效，行为错位极难排查。根因是安装方式不统一（registry / file: 混用 + 无装后校验）。
> 使用提示：本节与 AGENTS.md、pre-commit 钩子、check-deploy.mjs 四处联动成拦截链，为硬性成文——建议整节保留，只按本库校对命令前缀。

### 统一规则

| 插件状态 | profile 安装方式 |
|---|---|
| 联调中（本目录有未提交改动） | `file:` 指向本目录源码目录 |
| 已入库、未发版 | `file:` 指向本目录（仓库根即插件） |
| 已发版且本目录 lib == 部署 lib | registry `^0.1.0` |

安装一律走官方入口（禁裸 npm install——npm 会把 peerDependencies 装进 profile，产生第二套 `@deepseek-ai/*`，导致 Symbol 错配 unscoped、webserver 版本错配 400）：

```bash
dsh plugin --profile web install
```

### 装后自检（每次 install 后必跑）

```bash
npm run check:deploy        # 一键自检，FAIL 即非零退出码（本单库即一个插件，无需 --pkg）
```

FAIL 条件：① registry 安装且与本目录 lib 有差异（同版本号不同内容，硬拦截）；② profile 内 `@deepseek-ai/` 出现非 cosmokit/schemastery 包；③ `file:` 安装为软链，或源码 lib ≠ 部署 lib。

手工等价命令（脚本不可用时）：

```bash
diff -rq lib ~/.dsh/profiles/web/node_modules/dsh-imgdraw/lib   # 1) 源码 lib == 部署 lib
ls ~/.dsh/profiles/web/node_modules/@deepseek-ai/              # 2) 无宿主核心包阴影（只允许 cosmokit/schemastery）
ls -la ~/.dsh/profiles/web/node_modules/ | grep dsh-imgdraw     # 3) file: 拷贝应为真实目录
```

### 强制执行（git hook）

pre-commit 钩子（`.githooks/pre-commit`）：提交涉及 `src/`、`scripts/` 改动时自动跑 `check:deploy`，FAIL 拒绝提交。启用：`git config core.hooksPath .githooks`。中间态确需跳过用 `--no-verify` 并注明。本仓库根 `AGENTS.md` 已内联规则摘要。

### 关键认知

- **版本号相同 ≠ 内容相同**：registry 包只在"发版→立即重装"闭环里可信；脱离闭环一律降级为 file: 直装
- peer 永远由宿主 dsh 提供（fallback 在 `~/.dsh/profiles/node_modules/@deepseek-ai/`），profile 内不装宿主核心包
- `file:` 场景禁止手动软链：Node 按 realpath 解析会脱离 profile 的宿主 fallback，报 `Cannot find package '@deepseek-ai/...'`
- **改 lib 必须同步进 src/**：CI 从 src 重建，只手改 lib 的修复发布时全丢（实践库踩过：该修复丢两个版本后才补回）
- 单库无需 `pnpm-workspace.yaml` / `overrides`（单一包非 workspace）
- 调整 profile（加/删其他插件）时 **bundles 列表是整体覆写**——曾把本插件连 deps 带 bundles 一起移出，
  插件静默消失（路由 404、按钮消失，无报错）。日常可用 `curl -s http://127.0.0.1:3080/imgdraw/` 秒查是否挂载

## 附录：高频坑速查表（回顾沉淀）

| 坑 | 症状 | 拦截环节 |
|---|---|---|
| 省略 client half | UI 消失 | 实现规范 + 质量 DoD |
| registry 装的插件改了源码没发版 | 同版本号不同内容，行为错位 | `check:deploy` + pre-commit 硬拦截 + AGENTS.md 内联 |
| 读宿主服务返回形状没查契约就猜 | 「看似对上」实未生效，被缓存/降级掩盖，重启即露馅 | Sprint 计划契约预检（stub 必须按宿主真实契约形状写） |
| bundle boot 早期用 `ctx.get` 取可选服务 | 工具注册成功、路由静默不注册（落 SPA fallback） | 分类纪律「可选服务一律 `ctx.inject`」 |
| 单库独立 `npm install` 只装自身 devDeps | `Cannot find package '@deepseek-ai/...'` | devDependencies 全量声明运行时可达宿主包 |
| semver 预发布元组不同（`^0.1.0-rc.6` vs `0.1.2-alpha.x`） | peer 装成混配版本，运行时 API 缺失 | peer/devDeps 下界必须与宿主**同元组** |
| `ctx.inject` 回调异步、mount 脚本同步检查 | 注册结果为空，误判挂载失败 | mount 断言必须在 inject 回调 settle 之后 |
