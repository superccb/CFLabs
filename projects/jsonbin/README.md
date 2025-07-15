# jsonbin

基於 Cloudflare Workers 的簡易 JSON 存儲 API 服務

## 技術棧
- Cloudflare Workers
- KV Namespace
- JavaScript (ES Modules)

## 項目結構
```
jsonbin/
├── package.json
├── wrangler.toml
├── README.md
├── src/
│   └── index.js
└── docs/
    └── guide/
        └── deploy.md
```

## 使用說明
1. 安裝依賴：
   ```bash
   npm install
   ```
2. 配置 wrangler.toml，填寫你的 KV Namespace ID。
3. 本地開發：
   ```bash
   npm run start
   ```
4. 部署到 Cloudflare Workers：
   ```bash
   npm run deploy
   ```
5. 詳細部署步驟請參見 [docs/guide/deploy.md](docs/guide/deploy.md)

## 許可證
MIT 