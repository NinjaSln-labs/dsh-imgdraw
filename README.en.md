# dsh-imgdraw

English | [简体中文](README.md)（Chinese is authoritative; the English translation may lag）

[![npm version](https://img.shields.io/npm/v/dsh-imgdraw)](https://www.npmjs.com/package/dsh-imgdraw)
[![License](https://img.shields.io/npm/l/dsh-imgdraw)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/NinjaSln-labs/dsh-imgdraw?style=social)](https://github.com/NinjaSln-labs/dsh-imgdraw)

Text-to-image for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness): an input-bar 🎨 生图 button with a prompt popup (prompt / size / count / backend / quota / async generation / 4-grid results / download / keep / delete / regenerate from history), a `draw_image` model tool, and an `/imgdraw/` image route with persisted history. Shipped as a stable bundle — survives restarts and loads with the profile. Backends: DashScope `wan2.7-image` (free default) and SiliconFlow `Qwen-Image`.

## Features

- **`draw_image` model tool** — synchronously waits for generation and returns `/imgdraw/<file>` URLs. Takes prompt / count / size / backend / tag; callable directly by the AI mid-conversation. 180s timeout, suited to large images.

- **🎨 生图 popup** — button left of the input bar → popup interaction: prompt input (one-click Sin v10 avatar template), aspect ratio (1:1 / 16:9 / 9:16 / 4:3 / 3:4), count (1–4), backend switch (dashscope / siliconflow), live quota display (remaining / total). Submission generates asynchronously (2s polling) and results render in a 4-grid preview; each image can be downloaded / kept (never cleaned) / deleted.

- **`/imgdraw` image route** — direct image URLs: `http://127.0.0.1:3080/imgdraw/<file>`. History persists across restarts (`~/.dsh/imgdraw/index.json`, atomic writes).

- **History & cleanup** — every job is recorded in `index.json` and survives restarts. Kept images are never cleaned; each round auto-cleans to the newest N files (default 24). Regenerate from any history entry.

- **Multiple backends** — switch backend/model via config, no code change. DashScope `wan2.7-image` by default (free quota), SiliconFlow `Qwen-Image` optional; move to `qwen-image-2.0` / `z-image-turbo` when quota runs out.

## Install

```bash
# after the npm release
dsh plugin add dsh-imgdraw
```

Local development (your machine's web profile):

```bash
cd ~/.dsh/profiles/web
npm add dsh-imgdraw@file:/path/to/dsh-imgdraw   # point at this standalone repo
# then add "dsh-imgdraw" to the dsh.profile.bundles list in package.json and restart dsh web
```

## Configuration (cordis.patch.yml / profile overlay, all optional)

| Field | Default | Meaning |
|---|---|---|
| `outDir` | `~/.dsh/imgdraw` | Image output directory |
| `keysPath` | `~/.dsh/image-api-keys.json` | API keys JSON (`dashscope` / `siliconflow` fields) |
| `routePrefix` | `/imgdraw` | Image route prefix (no trailing slash) |
| `rpcPath` | `/imgdraw-rpc` | Browser JSON RPC route |
| `keepLatest` | `24` | Newest files kept per cleanup round (kept files are never cleaned) |
| `maxCount` | `4` | Max images per request |
| `defaultBackend` | `dashscope` | Default backend: `dashscope` (free wan2.7-image) or `siliconflow` (Qwen-Image) |
| `dashscopeModel` | `wan2.7-image` | DashScope model |
| `siliconflowModel` | `Qwen/Qwen-Image` | SiliconFlow model |
| `historyCap` | `50` | History cap in `index.json` |

Example:

```yaml
- id: imgdraw
  name: 'dsh-imgdraw'
  config:
    keepLatest: 40
    defaultBackend: 'dashscope'
```

## Usage

- **Model tool**: `draw_image` (prompt / count / size / backend / tag) — waits synchronously for generation and returns `/imgdraw/<file>` URLs.
- **Browser**: the 🎨 生图 button next to the input bar → popup with prompt (one-click Sin v10 avatar template) → generate → 4-grid preview → download / keep / delete; "recent" history persists across restarts (`~/.dsh/imgdraw/index.json`).
- **Direct URL**: `http://127.0.0.1:3080/imgdraw/<file>`.

## HTTP API

Both routes bind to `127.0.0.1` (loopback). All responses use the JSON envelope `{ ok: true, result }` / `{ ok: false, error }`.

### GET

| Route | Description |
|---|---|
| `GET /imgdraw/` | `{ ok, route, files: JobFile[] }` — scan of the output directory (latest 40) |
| `GET /imgdraw/<file>` | Image bytes (`image/png`, etc.); illegal name (`.`, `..`, path separators, >200 chars) → `400 { ok:false, error:'invalid name' }`; legal name but absent → `404` |

### POST `/imgdraw-rpc`

The request body is a single envelope `{ "method": "...", "args": { ... } }`.

| Method | Args | Returns `result` |
|---|---|---|
| `submit` | `prompt` (required) · `count` 1–4, default 1 · `size` default `1024*1024` · `backend` `dashscope` \| `siliconflow`, default from config · `tag` default `img` (only `\w-` kept, truncated to 40) | `{ jobId }`; `ok:false` when `prompt` is empty |
| `status` | **`jobId`** (not `id`) | `{ jobId, status, prompt, backend, files, createdAt, finishedAt }` (`error` present only on failure); `ok:false` `任务不存在` when unknown |
| `latest` | — | `{ files, jobs, quota }` (`quota` is a **cumulative success count**, not a remaining balance) |
| `select` | `name` (file name) · `keep` (`true` keep / `false` unkeep) | `{ kept }` |
| `delete` | `name` (file name) | `{ deleted }`; **removes the file only** — the job record and `quota` counter are retained |
| `backends` | — | `{ backends: [{ id, label, model, keyPresent, quota, quotaHint, sizeHint }] }` |
| `refresh-keys` | — | `{ ok }`; reloads the keys file (no restart needed after adding a key) |

File-name args are normalized with `basename` and reject path separators, `.` / `..` and names over 200 chars; `tag` feeds the generated name `draw-<tag>-<timestamp>[-<index>].<ext>`.

`status` reads only the in-process job table (populated by `submit`, **not** back-filled from `index.json` at boot) — after a restart no `jobId` submitted before it is queryable (running jobs are marked `interrupted`); `latest` and `GET /imgdraw/` read from disk, so history and files survive restarts.

## Backends

- **DashScope wan2.7-image (default)**: synchronous `multimodal-generation/generation` endpoint (CN domain preferred, intl fallback); free quota is limited — switch to qwen-image or z-image-turbo once exhausted.
- **SiliconFlow Qwen-Image**: `images/generations` endpoint, depends on account credits/balance.
- keys file: `~/.dsh/image-api-keys.json` (`{"dashscope": "sk-...", "siliconflow": "sk-...", ...}`).

## Development

```bash
npm install --legacy-peer-deps   # peers are provided by the host dsh; devDeps are for build/typecheck
npm run build                    # tsc → lib/ + esbuild → lib/client.js
npm run typecheck                # strict typecheck
```

Known pitfalls: the client RPC has no `harness.handle` (bundles lack that bridge) — Client→Host goes over a same-origin `/imgdraw-rpc` HTTP route; generation must be submitted asynchronously and polled (browser fetch 30s cap); dynamic plugins are lost on restart by DSH design — this package is a stable bundle and unaffected.

## Design decisions

| Decision | Rationale |
|---|---|
| Stable bundle rather than a dynamic plugin | Dynamic plugins are lost on restart by DSH design; a stable bundle survives restarts, loads with the profile and needs no re-approval |
| Client→Host over same-origin `/imgdraw-rpc` HTTP | Bundle clients lack the `harness.handle` bridge, so RPC goes through a self-hosted same-origin route (loopback, basename-checked to prevent path traversal) |
| Async submit + 2s polling | Browser fetch has a 30s cap and long generations need async handling; the `draw_image` tool path can wait synchronously (180s timeout) |
| DashScope by default rather than Gemini | Gemini has regional restrictions (AI Studio "Unable to check subscription"); DashScope wan2.7-image has a free quota and works from CN directly |
| Locally counted quota | The APIs expose no billing query — quota is counted locally and cross-checked manually, no fake integration |

## ⭐ Support

If you find this plugin useful, please ⭐ Star the [GitHub repository](https://github.com/NinjaSln-labs/dsh-imgdraw) — it keeps me maintaining it. Issues and PRs are welcome.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md); development flow and deployment discipline in [DEVELOPMENT.md](DEVELOPMENT.md); release flow in `.github/workflows/publish.yml`.

## License

[MIT](./LICENSE) — Copyright (c) 2026 ninjasln

Switched back to `img.shields.io/npm/l/dsh-imgdraw` after publishing (read from the `license` field in `package.json`).

The version badge above shows **orange** while the version is `0.x` — that is shields.io's standard semver coloring for zero-version packages (`esbuild` 0.x is orange too), not a package-state anomaly; it turns blue from `1.0.0` onward.
