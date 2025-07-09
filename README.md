# CFLabs - Cloudflare 項目實驗室

> 收集和實踐 Cloudflare 各種產品的開源項目，專注於展示 CF 生態系統的強大功能。

## 🎯 項目目標

CFLabs 是一個專門收集和實踐 Cloudflare 項目的 mono repo，旨在：

- 📚 **學習實踐**: 深入了解 Cloudflare 各種產品的使用
- 🔧 **項目收集**: 整理實用的 CF 開源項目和最佳實踐
- 🚀 **一鍵部署**: 每個項目都提供便捷的部署方式
- 📖 **知識積累**: 記錄開發過程中的學習心得和技術總結
- 🤖 **AI 探索**: 展示 Cloudflare Workers AI 的強大能力

## 🏗️ 項目結構

```
CFLabs/
├── projects/                    # 所有 CF 項目代碼
│   ├── ai-image-generator/     # AI 圖像生成器
│   ├── ai-text-summarizer/     # AI 文字摘要器
│   ├── article-recommender/    # 相似文章推薦系統
│   ├── rag-chatbot/           # RAG 聊天機器人
│   ├── cloud-notepad/          # 雲筆記本項目
│   └── rss-aggregator/         # RSS 聚合器項目
├── docs/                       # 技術文檔和學習筆記
│   └── cloudflare/            # Cloudflare 專題文檔
├── scripts/                    # 通用腳本
├── templates/                  # 項目模板
└── README.md                   # 主文檔
```

## 📦 項目列表

### 🎨 AI 圖像生成器
> 基於 Cloudflare Workers AI 的智能圖像生成服務

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/superccb/CFLabs/tree/main/projects/ai-image-generator)

**技術特性**:
- ✨ **Workers AI**: 多模型圖像生成
- 🎨 **多模型支持**: Flux、DreamShaper、SDXL 等
- 📱 **響應式界面**: 現代化 Web UI
- 💾 **智能緩存**: KV 存儲優化性能
- ⚡ **快速生成**: 邊緣計算加速

**功能亮點**:
- 支持多種 AI 圖像生成模型
- 靈活的圖像尺寸和質量配置
- 智能緩存機制減少重複生成
- 美觀的響應式用戶界面
- 完整的 REST API 支持

[📖 詳細文檔](./projects/ai-image-generator/README.md)

---

### 📝 AI 文字摘要器
> 基於 Cloudflare Workers AI 的智能文本摘要服務

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/superccb/CFLabs/tree/main/projects/ai-text-summarizer)

**技術特性**:
- ✨ **Workers AI**: 多模型文本處理
- 📝 **智能摘要**: 多種摘要風格和語言
- 🌐 **網頁提取**: 自動提取網頁內容
- 🔄 **流式響應**: Server-Sent Events 實時顯示
- 💾 **雙重緩存**: D1 + KV 存儲優化

**功能亮點**:
- 支持簡潔、詳細、要點列表等多種摘要風格
- 中英文等多語言支持
- 網頁內容自動提取和摘要
- 流式響應實時顯示生成過程
- 完整的博客摘要 API 兼容性

[📖 詳細文檔](./projects/ai-text-summarizer/README.md)

---

### 🎯 相似文章推薦系統
> 基於 Cloudflare Vectorize 的智能文章推薦系統

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/superccb/CFLabs/tree/main/projects/article-recommender)

**技術特性**:
- 🧠 **Vectorize**: 向量相似度計算
- 🎯 **智能推薦**: 基於內容相似度的精準推薦
- ⚡ **高性能**: 緩存機制提升響應速度
- 🔄 **自動更新**: 內容變更檢測
- 📱 **前端友好**: 完整的前端工具函數

**功能亮點**:
- 基於向量相似度的精準文章推薦
- 高性能緩存機制
- 支持文章內容變更檢測
- 提供完整的前端集成工具
- 推薦效果統計和監控

[📖 詳細文檔](./projects/article-recommender/README.md)

---

### 🤖 RAG 聊天機器人
> 基於 Cloudflare Vectorize 的知識庫 AI 助手

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/superccb/CFLabs/tree/main/projects/rag-chatbot)

**技術特性**:
- 🤖 **RAG 架構**: 檢索增強生成
- 🧠 **Vectorize**: 向量數據庫檢索
- 🌐 **多語言**: 中英文翻譯支持
- 📊 **統計功能**: 文章訪問量統計
- ⚡ **邊緣計算**: 全球分布式部署

**功能亮點**:
- 基於知識庫的智能對話
- 自動文章摘要和向量化存儲
- 相似度查詢和上下文構建
- 多語言翻譯處理
- 完整的文章管理功能

[📖 詳細文檔](./projects/rag-chatbot/README.md)

---

### 📝 雲筆記本
> 基於 Cloudflare Workers + KV 的無服務器筆記應用

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/superccb/CFLabs/tree/main/projects/cloud-notepad)

**技術特性**:
- ✨ **Workers**: 無服務器計算
- 📦 **KV Storage**: 筆記數據存儲
- 🎨 **響應式設計**: 適配各種設備
- 🔒 **安全存儲**: 加密哈希處理

**功能亮點**:
- 無需註冊登錄，打開即用
- 自動保存筆記內容
- 支持自定義筆記 URL
- 美觀的毛玻璃界面設計
- 實時保存狀態指示

[📖 詳細文檔](./projects/cloud-notepad/README.md)

---

### 🔄 RSS 聚合器
> 基於 Cloudflare Workers 的智能 RSS 聚合服務

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/superccb/CFLabs/tree/main/projects/rss-aggregator)

**技術特性**:
- ✨ **Workers**: 無服務器計算
- 📦 **KV Storage**: 數據緩存
- ⏰ **Cron Triggers**: 定時任務
- 🎨 **響應式界面**: 現代化 Web UI

**功能亮點**:
- 自動爬取多個 RSS 源
- 智能去重和內容聚合
- 美觀的 Web 界面展示
- 完整的 REST API
- 實時狀態監控

[📖 詳細文檔](./projects/rss-aggregator/README.md)

---

### 🚧 即將推出的項目

- **KV 緩存示例** - 展示 KV 存儲的最佳實踐
- **D1 數據庫應用** - 全功能的 CRUD 應用
- **Pages 靜態站點** - 結合 Workers 的動態功能
- **Durable Objects 實時聊天** - WebSocket 實時通信
- **Workers AI 應用** - 更多 AI 功能探索

## 📚 技術文檔

`docs/` 目錄包含開發過程中的技術積累：

### 🎯 核心技術文檔
- [AI Agent in a Box](./docs/AI-Agent_in_a_Box.md) - AI 代理部署指南
- [CF ttyd VPS](./docs/cf_ttyd_vps.md) - 終端服務配置
- [CI/CD Canary Design](./docs/CICD_canary_design.md) - 金絲雀部署設計
- [CMS Setup](./docs/CMS_setup.md) - 內容管理系統配置
- [VPS Monitoring](./docs/VPS_Monitoring_with_CF_Workers.md) - 服務器監控方案

### ☁️ Cloudflare 專題文檔
- [Cloudflare 快速參考](./docs/cloudflare/quick-reference.md) - CF 產品快速查詢
- [Cloudflare 服務對比](./docs/cloudflare/service-comparison.md) - 各服務功能對比
- [Cloudflare 無服務器特性](./docs/cloudflare/serverless-features.md) - 無服務器功能詳解
- [Cloudflare 更新日誌](./docs/cloudflare/cloudflare-updates.md) - 產品更新記錄
- [Cloudflare 文檔中心](./docs/cloudflare/README.md) - 專題文檔導航

## 🚀 快速開始

### 1. 環境準備

```bash
# 安裝 Wrangler CLI
npm install -g wrangler

# 登錄 Cloudflare
wrangler login
```

### 2. 部署項目

每個項目都支持一鍵部署，點擊項目的部署按鈕即可。

或者手動部署：

```bash
# 克隆倉庫
git clone https://github.com/superccb/CFLabs.git
cd CFLabs

# 進入具體項目目錄
cd projects/ai-image-generator  # 或其他項目

# 安裝依賴
npm install

# 部署到 Cloudflare
npm run deploy
```

### 3. 本地開發

```bash
# 進入項目目錄
cd projects/ai-image-generator  # 或其他項目

# 啟動開發服務器
npm run dev
```

## 🛠️ 開發指南

### 項目規範

- 每個項目都有獨立的 `README.md` 文件
- 統一的 GitHub Actions 部署流程
- 遵循 CF 最佳實踐
- 完整的錯誤處理和日誌記錄
- AI 項目包含完整的模型配置說明

### 貢獻流程

1. **Fork 項目**
2. **創建特性分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'feat: add amazing feature'`)
4. **推送分支** (`git push origin feature/AmazingFeature`)
5. **創建 Pull Request**

### 提交規範

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 規範：

```
feat: 新增功能
fix: 修復問題
docs: 文檔更新
style: 代碼格式調整
refactor: 代碼重構
test: 測試相關
chore: 構建或工具變更
```

## 🔧 開發環境

- **Node.js**: >= 18.0.0
- **Wrangler**: 最新版本
- **Git**: 版本控制
- **VSCode**: 推薦編輯器

## 📖 學習資源

### 官方文檔
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/)
- [Cloudflare Vectorize](https://developers.cloudflare.com/vectorize/)
- [Cloudflare KV](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)

### 社區資源
- [Workers Examples](https://github.com/cloudflare/workers-examples)
- [Awesome Cloudflare](https://github.com/irazasyed/awesome-cloudflare)
- [CF Community](https://community.cloudflare.com/)

## 🤝 貢獻者

感謝所有為這個項目做出貢獻的開發者！

## 📄 許可證

本項目使用 MIT 許可證。詳見 [LICENSE](LICENSE) 文件。

## 🆘 獲取幫助

- 🐛 [報告問題](https://github.com/superccb/CFLabs/issues)
- 💡 [功能建議](https://github.com/superccb/CFLabs/issues/new?template=feature_request.md)
- 📧 [聯繫我們](mailto:your-email@example.com)

---

⭐ 如果這個項目對您有幫助，請給它一個星星！

🔗 **相關鏈接**:
- [Cloudflare 官網](https://www.cloudflare.com/)
- [Cloudflare 開發者平台](https://developers.cloudflare.com/)
- [Wrangler CLI 文檔](https://developers.cloudflare.com/workers/wrangler/)
