# 安全策略

## 报告漏洞

本插件在宿主 harness 内以**服务消费方**身份工作：它调用第三方图像生成 API（DashScope 百炼 / SiliconFlow），本身不管理凭据——凭据由用户在自己的 `~/.dsh/image-api-keys.json` 中配置。安全边界值得关注的点：

- **API 凭据**：用户在 `~/.dsh/image-api-keys.json` 存放 API keys（`dashscope` / `siliconflow` 字段），该文件默认权限为当前用户。插件只在内存中读取使用，不写入日志。
- **图片输出**：生成图片输出到 `~/.dsh/imgdraw/` 目录，通过 `/imgdraw/<文件名>` 路由提供访问。路由仅限本机端口（`127.0.0.1:3080`），不暴露到外网。
- **依赖**：发布产物携带的最小依赖（无额外运行时依赖，peer 由宿主 dsh 提供）。构建依赖（esbuild / typescript）仅用于开发，不包含在发布产物中。
- **外部 API 调用**：默认后端（DashScope wan2.7-image）使用国内域名优先，intl 备用；SiliconFlow 使用 `images/generations` 端点。请求内容为用户输入的提示词，经插件原样透传。

若你发现漏洞或安全缺陷，**不要**公开 issue——直接到 GitHub 仓库 Security 标签页用私密漏洞报告。

## 响应

- 确认收到后 72 小时内回复。
- 严重漏洞优先修复并发布补丁版本。