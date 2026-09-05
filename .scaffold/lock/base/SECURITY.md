# 安全策略

## 支持面

本仓库是 DeepSeek Harness 的文生图插件（bundle）。安全边界值得关注的面：

- **网络入口**：`/imgdraw/<文件名>` 图片路由与 `/imgdraw-rpc` JSON RPC，均只监听本机回环地址（`127.0.0.1:3080`），不暴露到外网。路由与 RPC 都只接受 basename（目录穿越与路径分隔符被拒）。
- **API 凭据**：用户在 `~/.dsh/image-api-keys.json` 存放 API keys（`dashscope` / `siliconflow` 字段），该文件默认权限为当前用户。插件只在内存中读取使用，不写入日志、不写入产物。
- **读写的敏感数据**：生成图片输出到 `~/.dsh/imgdraw/` 目录；历史记录 `~/.dsh/imgdraw/index.json` 记录提示词文本（用户输入原样），跨重启持久化。
- **外部 API 调用**：默认后端（DashScope wan2.7-image）国内域名优先、intl 备用；SiliconFlow 使用 `images/generations` 端点。请求内容为用户输入的提示词，经插件原样透传。
- **依赖**：发布产物无额外运行时依赖（peer 由宿主 dsh 提供）。构建依赖（esbuild / typescript）仅用于开发，不包含在发布产物中。

## 报告漏洞

若你发现漏洞或安全缺陷，**不要**公开 issue——直接到 GitHub 仓库 Security 标签页用私密漏洞报告
（Private vulnerability reporting，首选）。

## 响应

- 确认收到后 72 小时内回复。
- 严重漏洞优先修复并发布补丁版本。
