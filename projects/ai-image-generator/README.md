# AI 圖像生成器

基於 Cloudflare Workers 的 AI 圖像生成服務，支持多種 AI 模型。

## 功能特性

- 🎨 **多模型支持**：OpenAI DALL-E 3 和 Stability AI SDXL
- 📱 **響應式界面**：現代化的 Web 界面，支持移動端
- ⚡ **快速生成**：基於 Cloudflare Workers 的無服務器架構
- 💾 **智能緩存**：使用 KV 存儲緩存生成結果，提升性能
- 🔧 **靈活配置**：支持多種圖像尺寸和質量選項

## 技術架構

- **運行時**：Cloudflare Workers
- **AI 服務**：Cloudflare Workers AI
- **存儲**：Cloudflare KV
- **前端**：原生 HTML/CSS/JavaScript

## 快速開始

### 1. 安裝依賴

```bash
cd projects/ai-image-generator
npm install
```

### 2. 配置 AI 綁定

在 Cloudflare Dashboard 中啟用 Workers AI 服務，並確保 AI 綁定已配置。

### 3. 創建 KV 命名空間

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

### 生成圖像

**POST** `/api/generate`

請求體：
```json
{
  "prompt": "一隻可愛的貓咪坐在花園裡",
  "model": "@cf/black-forest-labs/flux-1-schnell",
  "resolution": {
    "width": 1024,
    "height": 1024
  }
}
```

響應：
```json
{
  "image": "https://example.com/image.png",
  "cached": false
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
      "name": "OpenAI DALL-E 3",
      "description": "高質量圖像生成，支持多種尺寸",
      "sizes": ["1024x1024", "1792x1024", "1024x1792"],
      "qualities": ["standard", "hd"]
    }
  ]
}
```

## 支持的模型

### Flux 1 Schnell
- **模型 ID**：`@cf/black-forest-labs/flux-1-schnell`
- **尺寸**：1024x1024
- **特點**：快速生成，高質量圖像

### DreamShaper 8 LCM
- **模型 ID**：`@cf/lykon/dreamshaper-8-lcm`
- **尺寸**：1024x1024, 1152x896, 896x1152
- **特點**：藝術風格圖像生成

### Stable Diffusion XL
- **模型 ID**：`@cf/stabilityai/stable-diffusion-xl-base-1.0`
- **尺寸**：1024x1024, 1152x896, 896x1152
- **特點**：高分辨率圖像生成

### SDXL Lightning
- **模型 ID**：`@cf/bytedance/stable-diffusion-xl-lightning`
- **尺寸**：1024x1024, 1152x896, 896x1152
- **特點**：超快速圖像生成

## 緩存機制

- 使用 Cloudflare KV 存儲生成的圖像 URL
- 緩存鍵基於模型、尺寸、質量和提示詞生成
- 緩存時間：1 小時
- 支持緩存命中檢測

## 開發指南

### 項目結構

```
ai-image-generator/
├── src/
│   └── index.js          # 主要邏輯
├── package.json          # 項目配置
├── wrangler.toml         # Cloudflare Workers 配置
└── README.md            # 項目文檔
```

### 添加新模型

1. 在 `handleImageGeneration` 函數中添加新的 case
2. 實現對應的生成函數
3. 在 `handleModelsList` 中添加模型信息
4. 更新前端界面

### 環境變量

- `ENVIRONMENT`：運行環境（development/production）

## 部署說明

### 生產環境部署

```bash
npm run publish
```

### 環境配置

在 `wrangler.toml` 中配置不同環境：

```toml
[env.production]
name = "ai-image-generator"
vars = { ENVIRONMENT = "production" }

[env.development]
name = "ai-image-generator-dev"
vars = { ENVIRONMENT = "development" }
```

## 故障排除

### 常見問題

1. **AI 綁定未配置**
   - 確保在 Cloudflare Dashboard 中啟用了 Workers AI 服務

2. **KV 命名空間錯誤**
   - 運行 `npm run setup` 重新創建命名空間

3. **圖像生成失敗**
   - 檢查 API 密鑰是否有效
   - 確認提示詞符合 API 要求

### 日誌查看

在 Cloudflare Dashboard 的 Workers 頁面查看實時日誌。

## 許可證

MIT License 