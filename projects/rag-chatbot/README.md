# RAG聊天機器人

基於Cloudflare Vectorize的知識庫AI助手，實現了RAG（Retrieval-Augmented Generation）功能。

## 功能特性

- 🤖 **智能對話**：基於知識庫的AI聊天機器人
- 📝 **文章摘要**：自動生成文章摘要並向量化存儲
- 🔍 **相似度查詢**：使用向量數據庫進行相似內容檢索
- 🌐 **多語言支持**：支持中英文翻譯和處理
- 📊 **點擊統計**：文章訪問量統計功能
- ⚡ **高性能**：基於Cloudflare Workers的邊緣計算

## 技術架構

### 核心組件

- **Cloudflare Workers**：無服務器運行環境
- **Cloudflare AI**：AI模型服務
  - `@cf/qwen/qwen1.5-14b-chat-awq`：聊天模型
  - `@cf/meta/m2m100-1.2b`：翻譯模型
  - `@cf/baai/bge-base-en-v1.5`：嵌入模型
- **Cloudflare Vectorize**：向量數據庫
- **Cloudflare D1**：關係型數據庫

### 工作流程

1. **文章處理**：上傳文章 → 生成摘要 → 翻譯為英文 → 向量化 → 存儲
2. **對話流程**：用戶問題 → 翻譯為英文 → 向量化 → 相似度查詢 → 上下文構建 → AI回答

## API端點

### 聊天對話
```
POST /ai_chat
Content-Type: application/x-www-form-urlencoded

info=用戶問題
```

### 文章摘要（流式）
```
GET /summary?id=文章ID
```

### 文章摘要（非流式）
```
GET /get_summary?id=文章ID&sign=內容哈希
```

### 檢查文章狀態
```
GET /is_uploaded?id=文章ID&sign=內容哈希
```

### 上傳文章
```
POST /upload_blog?id=文章ID
Content-Type: text/plain

文章內容
```

### 點擊統計
```
GET /count_click?id=文章ID
GET /count_click_add?id=文章ID
```

## 數據庫結構

### blog_summary表
```sql
CREATE TABLE blog_summary (
  id TEXT PRIMARY KEY,
  content TEXT,
  summary TEXT,
  is_vec INTEGER DEFAULT 0
);
```

### counter表
```sql
CREATE TABLE counter (
  url TEXT PRIMARY KEY,
  counter INTEGER DEFAULT 0
);
```

## 部署步驟

1. **安裝依賴**
   ```bash
   npm install
   ```

2. **配置環境**
   - 修改 `wrangler.toml` 中的數據庫ID
   - 創建D1數據庫和Vectorize索引

3. **本地開發**
   ```bash
   npm run dev
   ```

4. **部署到Cloudflare**
   ```bash
   npm run deploy
   ```

## 配置說明

### wrangler.toml
```toml
name = "rag-chatbot"
main = "src/index.js"
compatibility_date = "2024-01-01"

[ai]
binding = "AI"

[[ai.models]]
binding = "AI"
model = "@cf/qwen/qwen1.5-14b-chat-awq"

[[ai.models]]
binding = "AI"
model = "@cf/meta/m2m100-1.2b"

[[ai.models]]
binding = "AI"
model = "@cf/baai/bge-base-en-v1.5"

[[vectorize]]
binding = "MAYX_INDEX"
index_name = "mayx-index"
dimensions = 768
metric = "cosine"

[[d1_databases]]
binding = "BLOG_SUMMARY"
database_name = "blog-summary"
database_id = "your-database-id"
```

## 使用示例

### 前端集成

```javascript
// 發送聊天消息
async function sendMessage(message) {
  const formData = new FormData();
  formData.append('info', message);
  
  const response = await fetch('/ai_chat', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  return result.results[0].values.text;
}

// 上傳文章
async function uploadArticle(id, content) {
  const response = await fetch(`/upload_blog?id=${id}`, {
    method: 'POST',
    body: content
  });
  
  return response.text();
}

// 獲取摘要
async function getSummary(id, sign) {
  const response = await fetch(`/get_summary?id=${id}&sign=${sign}`);
  return response.text();
}
```

## 注意事項

1. **向量數據庫創建**：需要通過Cloudflare API或命令行工具創建Vectorize索引
2. **模型限制**：免費版有使用額度限制，注意監控使用量
3. **數據安全**：建議添加適當的認證和授權機制
4. **性能優化**：可以考慮添加緩存機制減少重複計算

## 開發計劃

- [ ] 添加用戶認證系統
- [ ] 實現對話歷史記錄
- [ ] 支持更多文件格式
- [ ] 添加管理後台
- [ ] 優化向量查詢性能

## 許可證

MIT License 