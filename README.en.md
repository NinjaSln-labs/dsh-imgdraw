# dsh-imgdraw

English | [简体中文](README.md)（Chinese is authoritative; the English translation may lag）

[![npm version](https://img.shields.io/npm/v/dsh-imgdraw)](https://www.npmjs.com/package/dsh-imgdraw)
[![License](https://img.shields.io/npm/l/dsh-imgdraw)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/NinjaSln-labs/dsh-imgdraw?style=social)](https://github.com/NinjaSln-labs/dsh-imgdraw)

Text-to-image for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness): an input-bar 🎨 生图 button with a prompt popup (prompt / size / count / backend / quota / async generation / 4-grid results / download / keep / delete / regenerate from history), a `draw_image` model tool, and an `/imgdraw/` image route with persisted history. Shipped as a stable bundle — survives restarts and loads with the profile. Backends: DashScope `wan2.7-image` (free default) and SiliconFlow `Qwen-Image`.

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

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md); development flow and deployment discipline in [DEVELOPMENT.md](DEVELOPMENT.md); release flow in `.github/workflows/publish.yml`.

## License

MIT
