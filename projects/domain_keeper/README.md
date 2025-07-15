# DomainKeeper

一个基于 Cloudflare Workers 的域名可视化管理面板，支持自定义输入和自动化集成两种模式。

## 目录结构

```
projects/domain_keeper/
  ├── src/
  │   ├── index.js           # 初级版：自定义输入域名
  │   └── domainkeeper.js    # 高级版：API集成/自动化
  ├── wrangler.toml          # Cloudflare Workers 配置
  ├── README.md              # 项目说明
  └── CURSOR.md              # 详细功能与部署说明
```

## 快速开始

1. 安装 [Wrangler](https://developers.cloudflare.com/workers/wrangler/)
2. 配置 wrangler.toml（见下方示例）
3. 选择 src/index.js 或 src/domainkeeper.js 作为入口，部署到 Cloudflare Workers

## wrangler.toml 示例

```
name = "domainkeeper"
type = "javascript"
main = "src/index.js" # 或 "src/domainkeeper.js"
compatibility_date = "2024-05-01"

[env.production]
kv_namespaces = [
  { binding = "DOMAIN_INFO", id = "<your_kv_namespace_id>" }
]

[vars]
CF_API_KEY = "<your_cloudflare_api_key>"
WHOIS_PROXY_URL = "<your_whois_proxy_url>"
ACCESS_PASSWORD = "<your_frontend_password>"
ADMIN_PASSWORD = "<your_backend_password>"
```

> 详细功能、变量说明和部署步骤请参见 CURSOR.md。

## 许可证

MIT 