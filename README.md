# dsh-imgdraw

[English](README.en.md) | 简体中文（中文为准，英文翻译可能滞后）

[![npm version](https://img.shields.io/npm/v/dsh-imgdraw)](https://www.npmjs.com/package/dsh-imgdraw)
[![License](https://img.shields.io/github/license/NinjaSln-labs/dsh-imgdraw)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/NinjaSln-labs/dsh-imgdraw?style=social)](https://github.com/NinjaSln-labs/dsh-imgdraw)

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 文生图插件：输入框「🎨 生图」按钮 + 弹窗（提示词 / 尺寸 / 数量 / 后端 / 配额 / 异步生成 / 4 格网格 / 下载 / 选定保留 / 删除 / 历史重新生成），并注册模型工具 `draw_image` 与 `/imgdraw/` 图片路由。正式 bundle：重启不丢，随 profile 自动加载。后端：DashScope `wan2.7-image`（免费默认）与 SiliconFlow `Qwen-Image`。

## 特性

- **`draw_image` 模型工具** — 同步等待生成，返回 `/imgdraw/<文件名>` URL 列表。支持 prompt / count / size / backend / tag 参数，AI 可直接在对话中调用。180s 超时，适合大图生成。

- **🎨 生图弹窗** — 输入框左侧按钮 → 弹窗交互：提示词输入（可一键填入 Sin v10 头像模板）、尺寸选择（1:1 / 16:9 / 9:16 / 4:3 / 3:4）、数量选择（1–4 张）、后端切换（dashscope / siliconflow）、实时配额显示（剩余次数/总额度）。提交后异步生成（2s 轮询），结果以 4 格网格展示，每张可下载 / 选定保留（永不清理） / 删除。

- **`/imgdraw` 图片路由** — 直链图片访问：`http://127.0.0.1:3080/imgdraw/<文件名>`。历史记录跨重启持久化（`~/.dsh/imgdraw/index.json`，原子写入）。

- **历史持久化与清理** — 所有 job 记录在 `index.json`，跨重启保留。选定保留的图片永不清理；每轮自动清理保留最新 N 张（默认 24）。支持从历史记录重新生成。

- **多后端支持** — 配置可切换后端与模型，无需改代码。默认 DashScope `wan2.7-image`（免费额度），可选 SiliconFlow `Qwen-Image`，用尽后切 `qwen-image-2.0` / `z-image-turbo`。

## 安装

```bash
# npm 发布后
dsh plugin add dsh-imgdraw
```

本地开发（本机 web profile，指向本单库目录）：

```bash
cd ~/.dsh/profiles/web
npm add dsh-imgdraw@file:/path/to/dsh-imgdraw
# 并在 package.json 的 dsh.profile.bundles 列表加入 "dsh-imgdraw"，然后重启 dsh web
```

## 配置（cordis.patch.yml / profile overlay，均可选）

| 字段 | 默认 | 说明 |
|---|---|---|
| `outDir` | `~/.dsh/imgdraw` | 图片输出目录 |
| `keysPath` | `~/.dsh/image-api-keys.json` | API keys JSON（dashscope / siliconflow 字段） |
| `routePrefix` | `/imgdraw` | 图片路由前缀（无尾斜杠） |
| `rpcPath` | `/imgdraw-rpc` | 浏览器 JSON RPC 路由 |
| `keepLatest` | `24` | 每轮清理后保留的最新文件数（选定保留的文件永不清理） |
| `maxCount` | `4` | 单次最大生成数量 |
| `defaultBackend` | `dashscope` | 默认后端：`dashscope`（百炼 wan2.7-image 免费）或 `siliconflow`（Qwen-Image） |
| `dashscopeModel` | `wan2.7-image` | 百炼模型 |
| `siliconflowModel` | `Qwen/Qwen-Image` | SiliconFlow 模型 |
| `historyCap` | `50` | 历史记录条数上限（index.json 最多保留的 job 数） |

示例：

```yaml
- id: imgdraw
  name: 'dsh-imgdraw'
  config:
    keepLatest: 40
    defaultBackend: 'dashscope'
```

## 使用

- **模型工具**：`draw_image`（prompt / count / size / backend / tag）——同步等待生成，返回 `/imgdraw/<文件名>` 列表。
- **浏览器**：输入框左侧「🎨 生图」→ 弹窗填提示词（可一键填入 Sin v10 头像模板）→ 生成 → 4 格网格预览 → 下载 / 保留 / 删除；「最近生成」历史跨重启持久化（`~/.dsh/imgdraw/index.json`）。
- **直链**：`http://127.0.0.1:3080/imgdraw/<文件名>`。

## HTTP API

两条路由均绑定 `127.0.0.1`（loopback）。所有响应统一 JSON 封套 `{ ok: true, result }` / `{ ok: false, error }`。

### GET

| 路由 | 说明 |
|---|---|
| `GET /imgdraw/` | `{ ok, route, files: JobFile[] }` —— 输出目录扫描结果（最近 40 个） |
| `GET /imgdraw/<文件名>` | 图片二进制（`image/png` 等）；文件名非法（`.` / `..` / 路径分隔符 / >200 字符）→ `400 { ok:false, error:'invalid name' }`；文件名合法但不存在 → `404` |

### POST `/imgdraw-rpc`

请求体为单一封套 `{ "method": "...", "args": { ... } }`。

| 方法 | 参数 | 返回 `result` |
|---|---|---|
| `submit` | `prompt`（必填）· `count` 1–4，默认 1 · `size` 默认 `1024*1024` · `backend` `dashscope` \| `siliconflow`，默认取配置 · `tag` 默认 `img`（仅保留 `\w-`，截断 40 字符） | `{ jobId }`；`prompt` 为空时 `ok:false` |
| `status` | **`jobId`**（注意不是 `id`） | `{ jobId, status, prompt, backend, files, createdAt, finishedAt }`（`error` 仅失败时出现）；查不到时 `ok:false` `任务不存在` |
| `latest` | — | `{ files, jobs, quota }`（`quota` 为**累计成功次数**，非剩余额度） |
| `select` | `name`（文件名）· `keep`（`true` 保留 / `false` 取消） | `{ kept }` |
| `delete` | `name`（文件名） | `{ deleted }`；**只删文件**，任务记录与 `quota` 计数均保留 |
| `backends` | — | `{ backends: [{ id, label, model, keyPresent, quota, quotaHint, sizeHint }] }` |
| `refresh-keys` | — | `{ ok }`；重新读取 keys 文件（新增 key 后不必重启） |

文件名参数经 `basename` 归一化并拒绝路径分隔符、`.` / `..` 与超长（>200）名称；`tag` 参与生成文件名 `draw-<tag>-<时间戳>[-<序号>].<ext>`。

`status` 只读进程内任务表（仅由 `submit` 填充，boot 时**不从** `index.json` 回填）—— 重启后重启前提交的任何 `jobId` 都查不到（运行中的任务被标记为 `interrupted`）；`latest` 与 `GET /imgdraw/` 读磁盘，历史与文件跨重启仍可见。

## 后端说明

- **百炼 wan2.7-image（默认）**：DashScope `multimodal-generation/generation` 同步端点（国内域名优先，intl 备用）；免费额度有限，用尽后建议切 qwen-image 系列或 z-image-turbo。
- **SiliconFlow Qwen-Image**：`images/generations` 端点，依赖账户券/余额。
- keys 文件：`~/.dsh/image-api-keys.json`（`{"dashscope": "sk-...", "siliconflow": "sk-...", ...}`）。

## 开发

```bash
npm install --legacy-peer-deps   # peer 由宿主 dsh 提供，devDeps 供构建/类型检查
npm run build                    # tsc → lib/ + esbuild → lib/client.js
npm run typecheck                # 严格类型检查
```

已知坑：客户端 RPC 无 harness.handle（bundle 半无此桥），Client→Host 走同源 `/imgdraw-rpc` HTTP；生成必须异步提交 + 轮询（浏览器 fetch 30s 上限）；动态插件重启丢失是 DSH 机制，本包为正式 bundle 不受影响。

## 设计决策

| 决策 | 原因 |
|---|---|
| 正式 bundle 而非动态插件 | 动态插件重启丢失是 DSH 机制；正式 bundle 重启不丢、随 profile 自动加载、无需重新批准 |
| Client→Host 走同源 `/imgdraw-rpc` HTTP | bundle Client 无 `harness.handle` 桥，RPC 需自建同源路由（loopback，文件名 basename 防穿越） |
| 生成异步提交 + 2s 轮询 | 浏览器 fetch 30s 上限，长耗时生成必须异步；`draw_image` 工具路径可同步等待（180s 超时） |
| 默认 DashScope 而非 Gemini | Gemini 有地区限制（AI Studio "Unable to check subscription"）；百炼 wan2.7-image 免费额度且国内直连 |
| 本地计数配额 | API 无账单查询接口，先本地计数 + 手动核对，不做假对接 |

## ⭐ 支持

如果这个插件对你有帮助，欢迎到 [GitHub 仓库](https://github.com/NinjaSln-labs/dsh-imgdraw) 点个 ⭐ Star——它是我持续维护的动力。也欢迎提 issue / PR 一起改进。

## 贡献与发版

贡献指南见 [CONTRIBUTING.md](CONTRIBUTING.md)，开发流程与部署纪律见 [DEVELOPMENT.md](DEVELOPMENT.md)，发布流程见 `.github/workflows/publish.yml`。

## License

[MIT](./LICENSE) — Copyright (c) 2026 ninjasln

发布到 npm 后，上方 License 徽章可切换回 `img.shields.io/npm/l/dsh-imgdraw`（取自 `package.json` 的 `license` 字段，当前为 `MIT`）。
