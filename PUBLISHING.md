# 发布记录：dsh-imgdraw

> 本文件由模板单源拼装（core + 分类 append）：发布通道/发布流程/应急发布由分类 append 决定；
> 共性纪律在 core。

## 发布状态（2026-09-05 更新）

| 项 | 状态 |
|---|---|
| npm | ✅ **已发布**（2026-09-05）：`0.1.0`（`latest`，CI 带 provenance）+ `0.1.0-rc.1`（`next`，本地 bootstrap 占位，无 provenance） |
| GitHub | `NinjaSln-labs/dsh-imgdraw` main；发版 tag `imgdraw-v*`（已用：`imgdraw-v0.1.0`） |
| 本地验证 | 验证链全绿（build → typecheck → mount）+ 实机四点运行时验收通过（工具 / 路由 / RPC / 弹窗） |
| 前置条件 | ✅ **Trusted Publisher 已配置**（2026-09-05，首次即通过）：Owner `NinjaSln-labs` / Repository `dsh-imgdraw` / Workflow file `publish.yml` / Environment 留空 |

## 版本历史

> 每版一行：**做了什么 + 为什么 + 怎么验证的**；重大教训展开写进当版条目。

- **0.1.0**（已发布，`latest`）— 文生图 bundle：`draw_image` 工具 + 生图弹窗 + `/imgdraw` 路由 + 历史持久化
  （feat `760b35d` + fix `2c80983` + 标准化 `1a94d2f`..`6f17e3e`）；tag `imgdraw-v0.1.0` 触发 CI 发布
  - 验证：CI 7 步全绿（含 `Guard: tag version matches package.json` / Verify / Publish）；provenance
    `SLSA provenance v1` 已生成（`npm view dist.attestations.provenance` 确认）；`npm audit signatures`
    23 个 attestations 通过；dist-tags `{ next: 0.1.0-rc.1, latest: 0.1.0 }`
- **0.1.0-rc.1**（已发布，`next`）— bootstrap 占位：Trusted Publisher 只能配在**已存在**的包上，
  npm 不给不存在的包配置，故先用本地 `npm publish --tag next` 创建包记录（本地 publish 拿不到 OIDC，
  因此无 provenance，别加 `--provenance` 会直接报错），再把 `0.1.0` 留给 CI 发正式版
  - 为什么用 rc 而不是直接发 `0.1.0`：npm 禁止覆盖已发布版本，且 `publish.yml` 有 tag/版本守卫
    （`GITHUB_REF` 必须等于 `refs/tags/imgdraw-v$(package.json version)`）—— 占位若用 `0.1.0`
    会把该版本永久锁死，CI 永远发不出
  - 验证：发布包下载核实干净（12 文件、`dependencies: null`、author 为对象形式）；从 registry 真实
    安装成功、0 vulnerabilities；host 半 require 报缺 peer 属预期（peer 由宿主 dsh 提供）


## 发布后验证（共性纪律）

- 确认 latest 已更新（包管理器或 GitHub Release 页）
- provenance/attestations 徽章（按通道）或等价完整性校验
- 实机重装/升级路径实测一遍（面向用户的安装命令照 README 走一遍）

> 通道专属验证命令由分类 append 覆盖（按实际通道选择对应命令）。

## 发布通道（npm OIDC Trusted Publishing）

**认证**：npm **Trusted Publishing（OIDC）**——无需 token，`.github/workflows/publish.yml` 的
`id-token: write` 自动鉴权 + provenance 签名（源仓库 public）。

## 日常发布流程

> 用显式两步而非 `npm version` 自动 commit+tag：npm version 默认打 `v%s` tag，与本库触发器
> `imgdraw-v*` 不符；且工作树脏时 npm 的自动 commit/tag 会被**静默跳过**（实践库实战）。

```sh
npm version patch --no-git-tag-version               # ① bump 版本（package.json + lockfile）
V="$(node -p "require('./package.json').version")"
git commit -am "chore: release dsh-imgdraw v$V — <一句话主旨>"
git tag imgdraw-v$V
git push && git push --tags                          # ② CI 接手：验证链 → 版本守卫 →（审批门）→ npm publish
```

## canary 灰度通道（先灰度再全量）

```sh
npm version prerelease --preid=next --no-git-tag-version
V="$(node -p "require('./package.json').version")"
git commit -am "chore: canary dsh-imgdraw v$V" && git tag imgdraw-v$V
git push && git push --tags
# 实测通过 → 晋级 latest：npm dist-tag add dsh-imgdraw@x.y.z latest
```

## 首次发布前置（一次性）

1. **Trusted Publisher 配置**：npmjs.com 包设置 → Trusted Publisher（owner / repo / `publish.yml`
   文件名逐字段一致；npm 不预校验，配错只在 publish 时报错；首次可能未保存成功——失败先重配一次）
2. **首次 bootstrap**：首版可手动 `npm publish`（本机 `npm login` 交互登录 + 2FA；2025-12 新规后
   npm 网站直接发布新包已禁，CLI 登录流程仍可），随后立即切 Trusted Publishing 由 CI 发布
3. **验证发布成功**：`npm view dsh-imgdraw dist-tags` + npm 页 provenance 徽章 + `npm audit signatures`

## 应急手动发布（CI 不可用时）

```sh
npm run build && npm run typecheck && npm test && npm publish --access public
```

> 本地手动发布**无法生成 provenance**（需 CI 的 OIDC），不要加 `--provenance`（本地会报错）；
> 本机为 `npm login` 登录态。仅应急用，事后照常走 CI。
> prerelease 应急发布加 `--tag next`（同 CI 分支逻辑，防止占用 latest）。

## 维护要点

- **外部服务变更**（后端 API / 免费额度到期 / 模型下架）：改 `generate.ts` 的后端目录与端点，
  或改 profile config `imgdraw.config.dashscopeModel`（无需改代码即可切模型）
- **client bundle**：改 client 源码后必须 `npm run build`；host 与 client 变更都需要重启 + 刷新浏览器
- **安全**：无 token 管理（OIDC）；workflow 权限最小化
