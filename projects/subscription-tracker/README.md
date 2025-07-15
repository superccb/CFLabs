# subscription-tracker

## 專案簡介
subscription-tracker 是一個用於追蹤和管理訂閱服務的工具，支援自動通知、訂閱到期提醒與簡易的管理介面。

## 技術棧
- Cloudflare Workers
- JavaScript
- KV Namespace（用於儲存訂閱資料）

## 專案結構
- `src/`：主要程式碼目錄，包含 API、處理器、工具等
- `wrangler.toml`：Cloudflare Workers 配置檔
- `package.json`：依賴管理與開發腳本

## 快速開始
1. 在 Cloudflare Workers 控制台建立對應的 KV Namespace。
2. 配置 wrangler.toml 並部署 Worker。
3. 透過 API 或 Web UI 管理訂閱項目。

## 功能特點
- 支援多種訂閱項目管理
- 到期自動通知
- Web UI 與 API 雙重管理介面

## 許可證
MIT License 