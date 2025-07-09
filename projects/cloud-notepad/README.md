# 雲筆記本 (Cloud Notepad)

> 基於 Cloudflare Workers + KV 的無服務器筆記應用

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/superccb/CFLabs/tree/main/projects/cloud-notepad)

## 📋 項目概述

雲筆記本是一個簡潔優雅的無服務器筆記應用，完全基於 Cloudflare Workers 和 KV 存儲構建。無需註冊登錄，打開即用，內容自動保存，全球高可用。

### ✨ 主要特性

- **🚀 無需註冊**: 直接開始寫作，無需任何註冊或登錄
- **💾 自動保存**: 內容會在您輸入時自動保存
- **🌍 全球可用**: 基於 Cloudflare 全球網絡，高可用性
- **🎨 美觀界面**: 現代化的響應式設計
- **🔒 安全存儲**: 使用 Cloudflare KV 安全存儲
- **📱 響應式**: 支持桌面和移動設備

### 🛠️ 技術棧

- **運行時**: Cloudflare Workers
- **存儲**: Cloudflare KV
- **前端**: 原生 HTML/CSS/JavaScript
- **部署**: GitHub Actions

## 🚀 快速開始

### 方法一：一鍵部署

1. 點擊上方的 "Deploy to Cloudflare Workers" 按鈕
2. 按照指引完成部署
3. 設置必要的環境變量（詳見下方配置部分）

### 方法二：手動部署

1. **克隆項目**
   ```bash
   git clone https://github.com/superccb/CFLabs.git
   cd CFLabs/projects/cloud-notepad
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

### 方法三：GitHub Actions 自動部署

1. **Fork 本項目**
2. **設置 GitHub Secrets**（參見配置部分）
3. **推送代碼觸發自動部署**

## 🔧 配置

### 必要的 GitHub Secrets

在 GitHub 倉庫設置中添加以下 Secrets：

```
CLOUDFLARE_API_TOKEN    # Cloudflare API Token
SCN_SALT               # 用於安全的鹽值
SCN_SECRET             # 用於安全的密鑰
SCN_KV_NAMESPACE_ID    # KV 命名空間 ID
SCN_KV_PREVIEW_ID      # KV 預覽命名空間 ID
```

### 獲取 Cloudflare API Token

1. 訪問 [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. 點擊 "Create Token"
3. 使用 "Edit Cloudflare Workers" 模板
4. 複製生成的 Token

### 創建 KV 命名空間

```bash
# 創建生產環境命名空間
wrangler kv:namespace create "NOTES"

# 創建預覽環境命名空間
wrangler kv:namespace create "NOTES" --preview
```

將返回的 ID 設置為 GitHub Secrets。

## 📖 使用指南

### 創建筆記

- **新隨機筆記**: 訪問根路徑 `/` 會自動生成隨機筆記 ID
- **自定義筆記**: 訪問 `/your-custom-name` 創建自定義筆記

### 編輯筆記

- 在編輯器中輸入內容
- 內容會在您停止輸入 1 秒後自動保存
- 左下角狀態指示器顯示保存狀態

### 管理筆記

- **清空筆記**: 點擊 "清空" 按鈕
- **新建筆記**: 點擊 "新建筆記" 按鈕
- **分享筆記**: 直接分享 URL 即可

## 🎨 界面特色

### 設計亮點

- **毛玻璃效果**: 使用 CSS backdrop-filter 實現
- **漸變背景**: 美觀的紫色漸變背景
- **響應式布局**: 適配各種設備尺寸
- **實時狀態**: 可視化的保存狀態指示器

### 用戶體驗

- **即開即用**: 無需註冊，打開即可使用
- **自動保存**: 無需手動保存，專注內容創作
- **狀態清晰**: 清楚的視覺反饋和狀態提示

## 🔍 API 文檔

### 獲取筆記內容

```http
GET /api/{noteId}
```

**響應示例**:
```json
{
  "content": "筆記內容",
  "noteId": "example123"
}
```

### 保存筆記內容

```http
POST /api/{noteId}
Content-Type: application/json

{
  "content": "要保存的內容"
}
```

**響應示例**:
```json
{
  "success": true,
  "message": "Note saved successfully",
  "noteId": "example123"
}
```

## 📁 項目結構

```
cloud-notepad/
├── src/
│   └── index.js            # 主入口文件
├── .github/workflows/
│   └── deploy.yml          # GitHub Actions 部署配置
├── wrangler.toml           # Cloudflare Workers 配置
├── package.json
└── README.md
```

## 🔒 安全性

### 數據保護

- 使用 SALT 和 SECRET 對筆記 ID 進行哈希處理
- 所有數據存儲在 Cloudflare KV 中
- 支持 HTTPS 加密傳輸

### 隱私政策

- 不收集任何個人信息
- 筆記內容僅存儲在 Cloudflare KV 中
- 沒有用戶追蹤或分析

## 🛡️ 限制和注意事項

- **KV 限制**: 遵循 Cloudflare KV 的使用限制
- **存儲大小**: 單個筆記最大 25MB
- **請求頻率**: 受 Workers 請求限制約束
- **數據持久性**: 數據存儲在 KV 中，具有高持久性

## 🚀 後續迭代計劃

- [ ] 添加 Markdown 支持
- [ ] 實現筆記搜索功能
- [ ] 增加筆記分類和標籤
- [ ] 支持筆記導出功能
- [ ] 添加主題切換功能
- [ ] 實現筆記版本歷史

## 🤝 貢獻指南

1. Fork 本項目
2. 創建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 創建 Pull Request

## 📄 許可證

本項目使用 MIT 許可證。詳見 [LICENSE](LICENSE) 文件。

## 🆘 故障排除

### 常見問題

1. **部署失敗**
   - 確保所有 GitHub Secrets 都已正確設置
   - 檢查 Cloudflare API Token 權限

2. **筆記無法保存**
   - 檢查 KV 命名空間是否正確創建
   - 確認 Workers 有 KV 寫入權限

3. **無法訪問**
   - 確認 Workers 域名配置正確
   - 檢查 DNS 解析是否正常

### 獲取幫助

- [Cloudflare Workers 文檔](https://developers.cloudflare.com/workers/)
- [GitHub Issues](https://github.com/superccb/CFLabs/issues)
- [Cloudflare 社區](https://community.cloudflare.com/)

---

⭐ 如果這個項目對您有幫助，請給它一個星星！

> 靈感來源：[serverless-cloud-notepad](https://github.com/ccc333bbb/serverless-cloud-notepad) 