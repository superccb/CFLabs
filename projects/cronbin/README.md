# cronbin

## 專案簡介
cronbin 是一個基於 Cloudflare Workers 的輕量級定時任務（Cron Job）管理工具，支援通過 Web UI 添加、編輯、刪除、手動執行定時任務，並可自動推送失敗通知。

## 技術棧
- Cloudflare Workers
- KV Namespace（用於儲存任務資料）
- 原生 JavaScript

## 專案結構
```
projects/cronbin/
├── src/
│   └── index.js         # 主 Worker 程式，包含所有業務邏輯
├── wrangler.toml        # Cloudflare Workers 配置檔
├── package.json         # 依賴管理（如有需要）
├── README.md            # 專案說明文件
└── docs/                # 詳細文檔（可選）
```

## 快速開始
1. 在 Cloudflare Workers 控制台建立名為 `CRONBIN` 的 KV Namespace。
2. 建立 Worker，綁定 KV Namespace（名稱：CRONBIN）。
3. 將 `src/index.js` 內容部署至 Worker。
4. 設定 Cron 觸發器（如每分鐘執行一次）。
5. （可選）設定自訂網域。

## 功能特點
- 支援分鐘數或 Cron 表達式定時
- 支援 URL 或 curl 命令作為任務目標
- 失敗時自動推送通知（可自訂 curl 模板）
- Web UI 管理所有任務

## 許可證
MIT License 