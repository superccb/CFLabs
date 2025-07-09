# AI 文字摘要器

基於 Cloudflare Workers 的智能文本摘要服務，支持多種 AI 模型和摘要風格。

## 功能特性

- 📝 **智能摘要**：支持多種 AI 模型的文本摘要
- 🌐 **網頁提取**：自動提取網頁內容並生成摘要
- 🎨 **多種風格**：簡潔、詳細、要點列表、學術、口語等風格
- 🌍 **多語言支持**：中文、英文、日文等
- ⚡ **快速處理**：基於 Cloudflare Workers 的無服務器架構
- 💾 **智能緩存**：使用 D1 數據庫和 KV 存儲緩存摘要結果
- 📱 **響應式界面**：現代化的 Web 界面，支持移動端
- 🔄 **流式響應**：支持 Server-Sent Events 實時顯示生成過程
- 🔒 **安全驗證**：使用 SHA-256 哈希驗證內容完整性
- 📊 **點擊統計**：內建點擊計數功能

## 技術架構

- **運行時**：Cloudflare Workers
- **AI 服務**：Cloudflare Workers AI
- **數據庫**：Cloudflare D1
- **存儲**：Cloudflare KV
- **前端**：原生 HTML/CSS/JavaScript

## 快速開始

### 1. 安裝依賴

```bash
cd projects/ai-text-summarizer
npm install
```

### 2. 配置 AI 綁定

在 Cloudflare Dashboard 中啟用 Workers AI 服務，並確保 AI 綁定已配置。

### 3. 創建 D1 數據庫和 KV 命名空間

```bash
npm run setup
```

### 4. 本地開發

```bash
npm run dev
```

### 5. 部署

```bash
npm run deploy
```

## API 文檔

### 博客摘要 API（兼容原參考代碼）

#### 流式摘要生成
**GET** `/summary?id={article_id}`

返回 Server-Sent Events 流式響應，實時顯示摘要生成過程。

#### 獲取摘要
**GET** `/get_summary?id={article_id}&sign={content_hash}`

返回已生成的摘要內容。

#### 檢查是否已上傳
**GET** `/is_uploaded?id={article_id}&sign={content_hash}`

返回 "yes" 或 "no" 表示內容是否已上傳。

#### 上傳博客內容
**POST** `/upload_blog?id={article_id}`

上傳博客內容到數據庫。

#### 點擊計數
**GET** `/count_click?id={article_id}`

獲取點擊次數。

**GET** `/count_click_add?id={article_id}`

增加點擊次數並返回新計數。

### 通用文本摘要 API

**POST** `/api/summarize`

請求體：
```json
{
  "text": "要摘要的文本內容",
  "model": "@cf/meta/llama-2-7b-chat-int8",
  "maxLength": 200,
  "style": "concise",
  "language": "zh-CN"
}
```

響應：
```json
{
  "summary": "生成的摘要內容",
  "cached": false
}
```

### 網頁文本提取

**POST** `/api/extract`

請求體：
```json
{
  "url": "https://example.com/article"
}
```

響應：
```json
{
  "text": "提取的文本內容",
  "url": "https://example.com/article"
}
```

### 獲取模型列表

**GET** `/api/models`

響應：
```json
{
  "models": [
    {
      "id": "openai",
      "name": "OpenAI GPT-3.5",
      "description": "快速準確的文本摘要",
      "maxLength": 500,
      "styles": ["concise", "detailed", "bullet", "academic", "casual"],
      "languages": ["zh-CN", "en-US", "ja-JP"]
    }
  ]
}
```

## 支持的模型

### Qwen 1.5 14B Chat（主要模型）
- **模型 ID**：`@cf/qwen/qwen1.5-14b-chat-awq`
- **最大長度**：5000 字
- **特點**：高質量中文摘要，專業文章摘要助手
- **用途**：博客摘要、文章摘要

### Llama 2 7B Chat
- **模型 ID**：`@cf/meta/llama-2-7b-chat-int8`
- **最大長度**：500 字
- **風格**：簡潔、詳細、要點列表、學術、口語
- **語言**：中文、英文、日文
- **特點**：快速準確的文本摘要

### Llama 3.1 8B Instruct
- **模型 ID**：`@cf/meta/llama-3.1-8b-instruct`
- **最大長度**：1000 字
- **風格**：簡潔、詳細、要點列表、學術、口語
- **語言**：中文、英文、日文
- **特點**：高質量文本摘要，理解能力強

### Mistral 7B Instruct
- **模型 ID**：`@cf/mistral/mistral-7b-instruct-v0.2`
- **最大長度**：800 字
- **風格**：簡潔、詳細、要點列表、學術、口語
- **語言**：中文、英文、日文
- **特點**：平衡性能和質量的文本摘要

## 摘要風格

- **簡潔明瞭**：簡短精煉的摘要
- **詳細完整**：包含更多細節的摘要
- **要點列表**：以要點形式呈現
- **學術風格**：正式的學術寫作風格
- **輕鬆口語**：輕鬆自然的表達方式

## 緩存機制

### D1 數據庫緩存
- 使用 Cloudflare D1 數據庫存儲博客內容和摘要
- 支持內容哈希驗證，確保數據完整性
- 自動更新摘要當內容發生變化

### KV 存儲緩存
- 使用 Cloudflare KV 存儲通用摘要結果
- 緩存鍵基於模型、長度、風格、語言和文本前100字符生成
- 緩存時間：2 小時
- 支持緩存命中檢測

## 開發指南

### 項目結構

```
ai-text-summarizer/
├── src/
│   └── index.js          # 主要邏輯
├── package.json          # 項目配置
├── wrangler.toml         # Cloudflare Workers 配置
└── README.md            # 項目文檔
```

### 添加新模型

1. 在 `handleTextSummarization` 函數中添加新的 case
2. 實現對應的摘要函數
3. 在 `handleModelsList` 中添加模型信息
4. 更新前端界面

### 環境變量

- `ENVIRONMENT`：運行環境（development/production）

## 使用示例

### 博客摘要集成（兼容原參考代碼）

```html
<b>AI摘要</b>
<p id="ai-output">正在生成中……</p>
<script>
  async function sha(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex;
  }
  
  async function ai_gen(){
    var postContent = "文章标题：" + "{{ page.title }}" + "；文章内容：" + "{{ page.content }}";
    var postContentSign = await sha(postContent);
    var outputContainer = document.getElementById("ai-output");
    
    $.get("https://your-domain.com/is_uploaded?id={{ page.url }}&sign=" + postContentSign, function (data) {
      if (data == "yes") {
        $.get("https://your-domain.com/get_summary?id={{ page.url }}&sign=" + postContentSign, function (data2) {
          outputContainer.textContent = data2;
        });
      } else {
        $.post("https://your-domain.com/upload_blog?id={{ page.url }}", postContent, function (data) {
          $.get("https://your-domain.com/get_summary?id={{ page.url }}&sign=" + postContentSign);
          const evSource = new EventSource("https://your-domain.com/summary?id={{ page.url }}");
          outputContainer.textContent = "";
          evSource.onmessage = (event) => {
            if (event.data == "[DONE]") {
              evSource.close();
              return;
            } else {
              const data = JSON.parse(event.data);
              outputContainer.textContent += data.response;
            }
          }
        });
      }
    });
  }
  ai_gen();
</script>
```

### 基本文本摘要

```javascript
const response = await fetch('/api/summarize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: '這是一段很長的文本內容...',
    model: '@cf/meta/llama-2-7b-chat-int8',
    maxLength: 200,
    style: 'concise',
    language: 'zh-CN'
  })
});

const result = await response.json();
console.log(result.summary);
```

### 網頁內容摘要

```javascript
// 先提取網頁文本
const extractResponse = await fetch('/api/extract', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com/article'
  })
});

const extractData = await extractResponse.json();

// 再生成摘要
const summaryResponse = await fetch('/api/summarize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: extractData.text,
    model: '@cf/meta/llama-3.1-8b-instruct',
    maxLength: 300,
    style: 'detailed'
  })
});

const summaryData = await summaryResponse.json();
console.log(summaryData.summary);
```

## 部署說明

### 生產環境部署

```bash
npm run publish
```

### 環境配置

在 `wrangler.toml` 中配置不同環境：

```toml
[env.production]
name = "ai-text-summarizer"
vars = { ENVIRONMENT = "production" }

[env.development]
name = "ai-text-summarizer-dev"
vars = { ENVIRONMENT = "development" }
```

## 故障排除

### 常見問題

1. **AI 綁定未配置**
   - 確保在 Cloudflare Dashboard 中啟用了 Workers AI 服務

2. **KV 命名空間錯誤**
   - 運行 `npm run setup` 重新創建命名空間

3. **文本過長**
   - 單次處理的文本不能超過 10000 字符

4. **網頁提取失敗**
   - 檢查 URL 是否可訪問
   - 確認目標網站沒有反爬蟲機制

### 日誌查看

在 Cloudflare Dashboard 的 Workers 頁面查看實時日誌。

## 性能優化

- 使用 KV 緩存減少重複計算
- 限制文本長度避免超時
- 優化 API 調用參數
- 支持並發處理多個請求

## 許可證

MIT License 