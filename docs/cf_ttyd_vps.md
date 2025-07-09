# Cloudflare Tunnel + ttyd VPS 安全終端訪問方案

## 概述

本文檔介紹如何使用 Cloudflare Tunnel 和 ttyd 建立安全的 VPS 終端訪問方案，通過 Google OAuth 身份驗證，實現零端口暴露的安全遠程訪問。

### 技術棧

- **ttyd**: 提供網頁終端界面
- **cloudflared**: 建立 Cloudflare Tunnel 隧道
- **Cloudflare Zero Trust**: 身份驗證和訪問控制
- **Google OAuth**: 身份驗證提供商

### 核心特性

- ✅ 零端口暴露，所有服務僅綁定 localhost
- ✅ Google OAuth 身份驗證
- ✅ 低權限用戶運行，提高安全性
- ✅ 支持多設備訪問（電腦、手機、平板）
- ✅ HTTPS 加密傳輸

## 架構設計

### 系統架構圖

```
┌─────────────────────────────────┐
│    用戶設備（瀏覽器）              │
└─────────────┬───────────────────┘
              │ HTTPS + OAuth 驗證
              ▼
┌─────────────────────────────────┐
│   Cloudflare Access (Zero Trust) │
└─────────────┬───────────────────┘
              │ 隧道代理
              ▼
┌─────────────────────────────────┐
│   cloudflared tunnel            │
│   → localhost:7681              │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│   ttyd (低權限用戶執行)           │
│   綁定 127.0.0.1:7681           │
└─────────────────────────────────┘
```

### 安全機制

1. **網絡層安全**: 所有服務僅綁定 localhost，無外部端口暴露
2. **身份驗證**: 通過 Cloudflare Access + Google OAuth 雙重驗證
3. **權限控制**: 使用專用低權限用戶運行 ttyd 服務
4. **傳輸加密**: 全程 HTTPS 加密通信

## 部署指南

### 環境要求

- 操作系統：Ubuntu 22.04 LTS 或更新版本
- 系統權限：sudo 權限
- 網絡要求：可訪問 GitHub 和 Cloudflare
- 域名：已添加到 Cloudflare 的域名

### 步驟一：安裝 ttyd

#### 安裝依賴包

```bash
sudo apt update && sudo apt install -y \
    cmake \
    g++ \
    libjson-c-dev \
    libwebsockets-dev \
    git \
    build-essential
```

#### 編譯安裝 ttyd

```bash
# 下載源代碼
git clone https://github.com/tsl0922/ttyd.git
cd ttyd

# 編譯安裝
mkdir build && cd build
cmake ..
make && sudo make install
```

#### 驗證安裝

```bash
ttyd --version
```

### 步驟二：創建系統用戶

為了提高安全性，創建專用的低權限用戶來運行 ttyd：

```bash
sudo adduser --disabled-password --gecos "" webuser
```

### 步驟三：配置 ttyd 系統服務

#### 創建服務文件

```bash
sudo nano /etc/systemd/system/ttyd.service
```

#### 服務配置內容

```ini
[Unit]
Description=ttyd terminal on localhost
After=network.target

[Service]
ExecStart=/usr/local/bin/ttyd -p 7681 -i 127.0.0.1 -u webuser bash
Restart=always
User=webuser
WorkingDirectory=/home/webuser

[Install]
WantedBy=multi-user.target
```

#### 啟動服務

```bash
sudo systemctl daemon-reload
sudo systemctl enable ttyd
sudo systemctl start ttyd
```

#### 檢查服務狀態

```bash
sudo systemctl status ttyd
```

### 步驟四：安裝和配置 cloudflared

#### 安裝 cloudflared

```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

#### 登入 Cloudflare

```bash
cloudflared login
```

> **注意**: 此命令會在瀏覽器中打開 Cloudflare 登入頁面，請完成授權流程。

#### 創建 Tunnel

```bash
cloudflared tunnel create vps-ttyd
```

#### 配置 Tunnel

創建配置文件：

```bash
sudo mkdir -p /etc/cloudflared
sudo nano /etc/cloudflared/config.yml
```

配置內容：

```yaml
tunnel: vps-ttyd
credentials-file: /home/your-user/.cloudflared/vps-ttyd.json

ingress:
  - hostname: terminal.yourdomain.com
    service: http://localhost:7681
  - service: http_status:404
```

> **重要**: 請將 `your-user` 替換為實際用戶名，`yourdomain.com` 替換為實際域名。

#### 設置 DNS 記錄

```bash
cloudflared tunnel route dns vps-ttyd terminal.yourdomain.com
```

#### 啟動 Tunnel 服務

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

### 步驟五：配置 Cloudflare Access

#### 訪問 Zero Trust 控制台

1. 前往 [Cloudflare Zero Trust 控制台](https://one.dash.cloudflare.com/)
2. 選擇您的域名

#### 創建 Access 應用程序

1. 導航到 **Access** → **Applications** → **Add Application**
2. 選擇 **Self-hosted** 應用程序類型
3. 填寫應用程序信息：
   - **Name**: `VPS Terminal`
   - **Domain**: `https://terminal.yourdomain.com`

#### 配置身份驗證

1. 在 **Authentication** 部分選擇 **Google OAuth**
2. 配置允許的 Google 帳號或 Google Workspace 域名

#### 設置訪問策略

1. 創建訪問策略規則
2. 設置允許訪問的用戶條件，例如：
   - Email equals: `your-email@gmail.com`
   - 或設置特定的 Google Workspace 域名

#### 保存並啟用

完成配置後，保存並啟用應用程序。

## 使用指南

### 訪問終端

1. 在瀏覽器中訪問 `https://terminal.yourdomain.com`
2. 系統會自動跳轉到 Google 登入頁面
3. 完成身份驗證後，即可訪問 VPS 終端

### 驗證流程

```
用戶請求 → Cloudflare Access 檢查 → Google OAuth 驗證 → 驗證通過 → 代理到 ttyd
```

## 安全加固

### 基本安全措施

1. **只讀模式**: 為某些用戶啟用只讀模式
   ```bash
   /usr/local/bin/ttyd -p 7681 -i 127.0.0.1 -u webuser --readonly bash
   ```

2. **目錄限制**: 限制用戶可操作的目錄
   ```bash
   /usr/local/bin/ttyd -p 7681 -i 127.0.0.1 -u webuser --cwd /home/webuser bash
   ```

3. **用戶權限**: 進一步限制 webuser 的系統權限
   ```bash
   # 限制 webuser 不能使用 sudo
   sudo usermod -s /bin/rbash webuser
   ```

### 高級安全措施

1. **二級代理**: 可選擇在 ttyd 前添加 Nginx 作為額外防護層
2. **日誌監控**: 啟用系統日誌監控，記錄所有終端活動
3. **定期更新**: 定期更新 ttyd、cloudflared 和系統軟件

## 故障排除

### 常見問題

#### ttyd 服務無法啟動

```bash
# 檢查服務狀態
sudo systemctl status ttyd

# 查看詳細日誌
sudo journalctl -u ttyd -f
```

#### cloudflared 連接失敗

```bash
# 檢查 tunnel 狀態
cloudflared tunnel list

# 檢查服務狀態
sudo systemctl status cloudflared

# 查看詳細日誌
sudo journalctl -u cloudflared -f
```

#### 無法訪問終端

1. 確認 DNS 記錄已正確設置
2. 檢查 Cloudflare Access 配置
3. 驗證 Google OAuth 設置

### 日誌位置

- ttyd 日誌: `sudo journalctl -u ttyd`
- cloudflared 日誌: `sudo journalctl -u cloudflared`
- 系統日誌: `/var/log/syslog`

## 維護和更新

### 定期維護任務

1. **系統更新**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **更新 cloudflared**
   ```bash
   sudo cloudflared update
   ```

3. **檢查服務狀態**
   ```bash
   sudo systemctl status ttyd cloudflared
   ```

### 備份重要配置

建議定期備份以下配置文件：
- `/etc/systemd/system/ttyd.service`
- `/etc/cloudflared/config.yml`
- `~/.cloudflared/` 目錄

## 參考資源

- [ttyd 官方文檔](https://github.com/tsl0922/ttyd)
- [Cloudflare Tunnel 文檔](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Cloudflare Access 文檔](https://developers.cloudflare.com/cloudflare-one/applications/)
- [Google OAuth 設置指南](https://developers.google.com/identity/protocols/oauth2)

## 許可證

本文檔遵循 MIT 許可證。

