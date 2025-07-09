# Cloudflare Serverless 開發文檔

本目錄包含 Cloudflare 平台 Serverless 開發的完整文檔，涵蓋從基礎概念到高級應用的所有內容。

## 文檔結構

### 📚 核心文檔
- **[serverless-features.md](./serverless-features.md)** - Cloudflare Serverless 功能完整列表
  - 20+ 個核心服務詳細介紹
  - 每個服務的用法和配置範例
  - 代碼示例和最佳實踐

- **[quick-reference.md](./quick-reference.md)** - 快速參考指南
  - 常用命令和配置
  - 代碼片段和模板
  - 調試和監控技巧

- **[service-comparison.md](./service-comparison.md)** - 服務對比與選擇指南
  - 各服務的對比表格
  - 適用場景分析
  - 架構模式建議

### 📖 更新追蹤
- **[../cloudflare-updates.md](../cloudflare-updates.md)** - Cloudflare 功能更新追蹤
  - 最新功能發布記錄
  - 重要更新分析
  - 技術債務追蹤

## 快速開始

### 1. 選擇你的應用類型

| 應用類型 | 推薦架構 | 參考文檔 |
|----------|----------|----------|
| **簡單 API** | Workers + D1 + KV | [serverless-features.md](./serverless-features.md#數據存儲) |
| **文件處理** | Workers + R2 + Queues | [serverless-features.md](./serverless-features.md#消息與隊列) |
| **實時協作** | Workers + Durable Objects + Pub/Sub | [serverless-features.md](./serverless-features.md#數據存儲) |
| **AI 應用** | Workers + Workers AI + D1 | [serverless-features.md](./serverless-features.md#ai-與機器學習) |
| **全棧應用** | Workers + D1 + R2 + KV | [serverless-features.md](./serverless-features.md#核心運行時) |

### 2. 安裝開發工具

```bash
# 安裝 Wrangler CLI
npm install -g wrangler

# 登入 Cloudflare
wrangler login

# 創建新項目
npm create cloudflare@latest my-project
```

### 3. 基本配置

```toml
# wrangler.toml
name = "my-worker"
main = "src/index.js"
compatibility_date = "2024-01-01"

# 添加需要的服務
[[d1_databases]]
binding = "DB"
database_name = "my-db"
database_id = "xxx"

[[ai]]
binding = "AI"
```

### 4. 開發和部署

```bash
# 本地開發
wrangler dev

# 部署到生產環境
wrangler deploy

# 查看日誌
wrangler tail
```

## 核心服務概覽

### 🚀 運行時
- **Workers** - 全球邊緣計算平台
- **Containers** - 容器化應用部署
- **Pages** - 靜態網站和全棧應用

### 🤖 AI 服務
- **Workers AI** - 邊緣 AI 推理
- **AI Agents SDK** - 智能 Agent 框架

### 💾 數據存儲
- **D1** - SQL 數據庫
- **R2** - 對象存儲
- **KV** - 鍵值存儲
- **Durable Objects** - 狀態管理
- **Hyperdrive** - 外部數據庫連接

### 📨 消息服務
- **Queues** - 異步消息隊列
- **Pub/Sub** - 發布訂閱

### 🛠️ 開發工具
- **Wrangler CLI** - 命令行工具
- **Vite Plugin** - 構建工具整合

### 🔒 安全服務
- **Access** - 身份驗證
- **Turnstile** - CAPTCHA 替代

### 📊 監控分析
- **Analytics Engine** - 數據分析
- **Logpush** - 日誌推送

## 學習路徑

### 初學者
1. 閱讀 [quick-reference.md](./quick-reference.md) 了解基本概念
2. 查看 [serverless-features.md](./serverless-features.md) 中的 Workers 部分
3. 創建第一個簡單的 Worker 項目

### 進階開發者
1. 學習 [service-comparison.md](./service-comparison.md) 選擇合適的服務
2. 深入學習 [serverless-features.md](./serverless-features.md) 中的高級功能
3. 參考架構模式設計複雜應用

### 架構師
1. 研究 [service-comparison.md](./service-comparison.md) 中的架構模式
2. 關注 [cloudflare-updates.md](../cloudflare-updates.md) 的最新更新
3. 設計可擴展的 Serverless 架構

## 常用資源

### 官方文檔
- [Cloudflare Workers 文檔](https://developers.cloudflare.com/workers/)
- [AI 文檔](https://developers.cloudflare.com/ai/)
- [數據庫文檔](https://developers.cloudflare.com/d1/)
- [存儲文檔](https://developers.cloudflare.com/r2/)

### 範例項目
- [Workers Examples](https://github.com/cloudflare/workers-examples)
- [AI Examples](https://github.com/cloudflare/workers-ai-examples)
- [Agents Examples](https://github.com/cloudflare/agents-examples)

### 社群資源
- [Cloudflare Discord](https://discord.cloudflare.com/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/cloudflare-workers)
- [Reddit r/Cloudflare](https://www.reddit.com/r/cloudflare/)

## 貢獻指南

### 文檔更新
1. 定期檢查 [cloudflare-updates.md](../cloudflare-updates.md) 的更新
2. 根據新功能更新相關文檔
3. 添加新的代碼示例和最佳實踐

### 內容維護
- 保持代碼示例的可運行性
- 更新過時的配置和命令
- 添加新的使用場景和架構模式

## 版本記錄

### v1.0.0 (2025-01-06)
- 創建完整的 Cloudflare Serverless 開發文檔
- 包含 20+ 個核心服務的詳細介紹
- 提供快速參考和服務對比指南
- 建立文檔結構和學習路徑

---

*文檔維護: 開發團隊*  
*最後更新: 2025-01-06* 