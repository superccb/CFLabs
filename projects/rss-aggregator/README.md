# RSS 聚合器

> 基於 Cloudflare Workers 的智能 RSS 聚合服務

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/your-username/CFLabs/tree/main/projects/rss-aggregator)

## 📋 項目概述

RSS 聚合器是一個使用 Cloudflare Workers 構建的無服務器應用，能夠自動爬取多個 RSS 源，聚合內容並提供美觀的 Web 界面和完整的 REST API。

### ✨ 主要特性

- **🕷️ 自動爬蟲**: 定時爬取 RSS 源（每30分鐘）
- **📦 KV 存儲**: 使用 Cloudflare KV 緩存數據
- **🎨 美觀界面**: 現代化的響應式 Web 界面
- **🔌 完整 API**: RESTful API 支持 CRUD 操作
- **🔄 實時更新**: 支持手動觸發爬蟲和狀態監控
- **📱 響應式設計**: 支持桌面和移動設備

### 🛠️ 技術棧

- **運行時**: Cloudflare Workers
- **存儲**: Cloudflare KV
- **定時任務**: Cron Triggers
- **前端**: 原生 HTML/CSS/JavaScript
- **部署**: GitHub Actions

## 🚀 快速開始

### 方法一：一鍵部署

點擊上方的 "Deploy to Cloudflare Workers" 按鈕，按照指引完成部署。

### 方法二：手動部署

1. **克隆項目**
   ```bash
   git clone https://github.com/your-username/CFLabs.git
   cd CFLabs/projects/rss-aggregator
   ```

2. **安裝依賴**
   ```bash
   npm install
   ```

3. **配置 Wrangler**
   ```bash
   wrangler login
   ```

4. **創建 KV 命名空間**
   ```bash
   npm run setup
   ```

5. **部署到 Cloudflare Workers**
   ```bash
   npm run deploy
   ```

## 📖 使用指南

### Web 界面

部署完成後，訪問您的 Worker 域名即可看到 Web 界面：

- **首頁**: 顯示聚合的 RSS 內容
- **統計信息**: 顯示源數量、文章數量和最後更新時間
- **篩選功能**: 按源或分類篩選內容
- **手動觸發**: 可手動觸發爬蟲更新

### API 端點

#### 獲取聚合數據
```http
GET /api/feeds?limit=50&offset=0&source=hackernews&category=tech
```

#### 管理 RSS 源
```http
# 獲取所有源
GET /api/sources

# 創建新源
POST /api/sources
{
  "name": "示例源",
  "url": "https://example.com/feed.xml",
  "description": "示例描述",
  "category": "tech"
}

# 更新源
PUT /api/sources/{sourceId}
{
  "active": false
}

# 刪除源
DELETE /api/sources/{sourceId}
```

#### 爬蟲管理
```http
# 獲取爬蟲狀態
GET /api/crawler/status

# 觸發爬蟲
POST /api/crawler/trigger
{
  "sourceId": "hackernews" // 可選，指定源
}
```

## 🔧 配置

### 環境變量

在 `wrangler.toml` 中配置：

```toml
[vars]
ENVIRONMENT = "production"
```

### 默認 RSS 源

項目預設了以下 RSS 源：

- **Hacker News**: 最新科技新聞
- **GitHub Trending**: 熱門開源項目
- **Dev.to**: 開發者文章

您可以通過 API 或直接修改 `src/utils/storage.js` 中的 `initializeDefaultSources` 函數來自定義。

## 📁 項目結構

```
rss-aggregator/
├── src/
│   ├── handlers/
│   │   ├── api.js          # API 路由處理
│   │   ├── crawler.js      # 爬蟲邏輯
│   │   └── web.js          # Web 界面處理
│   ├── utils/
│   │   ├── rss-parser.js   # RSS 解析工具
│   │   └── storage.js      # KV 存儲工具
│   └── index.js            # 主入口
├── .github/workflows/
│   └── deploy.yml          # GitHub Actions 部署
├── wrangler.toml           # Cloudflare 配置
├── package.json
└── README.md
```

## 🔍 監控和調試

### 日誌查看

```bash
# 查看實時日誌
wrangler tail

# 查看部署日誌
wrangler logs
```

### 健康檢查

```http
GET /health
```

返回服務狀態和版本信息。

## 🛡️ 安全和限制

- **速率限制**: 遵循 Cloudflare Workers 限制
- **存儲限制**: KV 存儲有大小和請求限制
- **執行時間**: 單次執行最多 30 秒
- **並發限制**: 同時爬取的源數量有限制

## 🤝 貢獻指南

1. Fork 本項目
2. 創建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 創建 Pull Request

## 📄 許可證

本項目使用 MIT 許可證。詳見 [LICENSE](LICENSE) 文件。

## 🆘 故障排除

### 常見問題

1. **部署失敗**
   - 確保 `CLOUDFLARE_API_TOKEN` 已正確配置
   - 檢查 KV 命名空間是否創建成功

2. **爬蟲無法工作**
   - 檢查 RSS URL 是否有效
   - 確認網絡連接正常

3. **數據不更新**
   - 手動觸發爬蟲
   - 檢查定時任務配置

### 獲取幫助

- [Cloudflare Workers 文檔](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 指南](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Issues](https://github.com/your-username/CFLabs/issues)

---

⭐ 如果這個項目對您有幫助，請給它一個星星！ 