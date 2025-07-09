# Cloudflare Tunnel + ttyd VPS 安全終端訪問方案

## 概述

本文檔介紹如何使用 Cloudflare Tunnel 和 ttyd 建立安全的 VPS 終端訪問方案，通過 Google OAuth 身份驗證，實現零端口暴露的安全遠程訪問。同時提供 Docker + Nginx 的替代部署方案。

### 技術棧

- **ttyd**: 提供網頁終端界面
- **cloudflared**: 建立 Cloudflare Tunnel 隧道
- **Cloudflare Zero Trust**: 身份驗證和訪問控制
- **Google OAuth**: 身份驗證提供商
- **Docker + Nginx**: 可選的容器化部署方案
- **Supervisor**: 進程管理和自動重啟

### 核心特性

- ✅ 零端口暴露，所有服務僅綁定 localhost
- ✅ Google OAuth 身份驗證
- ✅ 低權限用戶運行，提高安全性
- ✅ 支持多設備訪問（電腦、手機、平板）
- ✅ HTTPS 加密傳輸
- ✅ 容器化部署支持
- ✅ 進程自動重啟和監控

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

### Docker + Nginx 架構（替代方案）

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
│   → localhost:8080              │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│   Docker Nginx (認證代理)         │
│   → Unix Socket                 │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│   ttyd (Unix Socket 模式)        │
│   綁定 /tmp/ttyd.sock           │
└─────────────────────────────────┘
```

### 安全機制

1. **網絡層安全**: 所有服務僅綁定 localhost，無外部端口暴露
2. **身份驗證**: 通過 Cloudflare Access + Google OAuth 雙重驗證
3. **權限控制**: 使用專用低權限用戶運行 ttyd 服務
4. **傳輸加密**: 全程 HTTPS 加密通信
5. **基礎認證**: 可選的 HTTP Basic Auth 作為額外防護
6. **進程監控**: 自動重啟和健康檢查

## 部署指南

### 環境要求

- 操作系統：Ubuntu 22.04 LTS 或更新版本
- 系統權限：sudo 權限
- 網絡要求：可訪問 GitHub 和 Cloudflare
- 域名：已添加到 Cloudflare 的域名
- Docker（可選）：用於容器化部署

## 方案一：傳統部署方式

### 步驟一：安裝 ttyd

#### 方法 1：編譯安裝

```bash
# 安裝依賴包
sudo apt update && sudo apt install -y \
    cmake \
    g++ \
    libjson-c-dev \
    libwebsockets-dev \
    git \
    build-essential

# 下載源代碼
git clone https://github.com/tsl0922/ttyd.git
cd ttyd

# 編譯安裝
mkdir build && cd build
cmake ..
make && sudo make install
```

#### 方法 2：直接下載二進制文件

根據 [蘇洋博客的建議](https://soulteary.com/2023/03/12/stable-web-terminal-services-using-docker-nginx-and-ttyd.html)，可以直接下載預編譯的二進制文件：

```bash
# 下載最新版本的 ttyd（根據系統架構選擇）
sudo curl -sL -o /usr/local/bin/ttyd "https://github.com/tsl0922/ttyd/releases/download/1.7.7/ttyd.x86_64"
sudo chmod +x /usr/local/bin/ttyd
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

## 方案二：Docker + Nginx 部署方式

基於 [蘇洋博客的實踐](https://soulteary.com/2023/03/12/stable-web-terminal-services-using-docker-nginx-and-ttyd.html)，提供更加靈活和安全的容器化部署方案。

### 步驟一：安裝 Supervisor 進程管理

```bash
sudo apt update && sudo apt install -y supervisor
```

### 步驟二：配置 ttyd 使用 Unix Socket

創建 Supervisor 配置文件：

```bash
sudo nano /etc/supervisor/conf.d/ttyd.conf
```

配置內容：

```ini
[program:ttyd]
directory = /root/
command = ttyd -i /tmp/ttyd.sock -H X-WEBAUTH-USER zsh
autostart = true
startsecs = 10
autorestart = true
startretries = 100000
stdout_logfile = /tmp/ttyd.log
user = webuser
```

重啟 Supervisor：

```bash
sudo service supervisor restart
```

### 步驟三：生成 HTTP Basic Auth 憑證

使用 Docker 生成認證文件：

```bash
# 生成用戶名和密碼（示例：用戶名 admin，密碼 yourpassword）
docker run --rm -it httpd:alpine htpasswd -nb admin yourpassword > .htpasswd
```

### 步驟四：創建 Nginx 配置

創建 `nginx.conf` 文件：

```nginx
user root;
worker_processes auto;

error_log /var/log/nginx/error.log notice;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        server_name localhost;

        location / {
            # 基礎認證（可選，作為額外防護）
            auth_basic "Terminal Access";
            auth_basic_user_file /etc/.htpasswd;

            # 設置認證頭部
            proxy_set_header X-WEBAUTH-USER $remote_user;
            proxy_set_header Authorization "";

            # WebSocket 支持
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            # 代理到 ttyd Unix Socket
            proxy_pass http://unix:/tmp/ttyd.sock;
        }
    }
}
```

### 步驟五：創建 Docker Compose 配置

創建 `docker-compose.yml` 文件：

```yaml
version: "3.8"

services:
  nginx-terminal:
    image: nginx:1.25-alpine
    restart: always
    ports:
      - "127.0.0.1:8080:80"
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - /etc/timezone:/etc/timezone:ro
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./.htpasswd:/etc/.htpasswd:ro
      - /tmp/ttyd.sock:/tmp/ttyd.sock:rw
    environment:
      - NGINX_ENTRYPOINT_QUIET_LOGS=1
    depends_on:
      - ttyd-service
    networks:
      - terminal-network

networks:
  terminal-network:
    driver: bridge
```

### 步驟六：配置 Cloudflared Tunnel

修改 cloudflared 配置，指向 Nginx 服務：

```yaml
tunnel: vps-ttyd
credentials-file: /home/your-user/.cloudflared/vps-ttyd.json

ingress:
  - hostname: terminal.yourdomain.com
    service: http://localhost:8080
  - service: http_status:404
```

### 步驟七：啟動服務

```bash
# 啟動 Docker 服務
docker compose up -d

# 重啟 cloudflared 服務
sudo systemctl restart cloudflared
```

### 步驟八：配置 Cloudflare Access

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
4. 如果啟用了 HTTP Basic Auth，還需要輸入額外的用戶名和密碼

### 驗證流程

```
用戶請求 → Cloudflare Access 檢查 → Google OAuth 驗證 → Nginx Basic Auth（可選） → 代理到 ttyd
```

### ttyd 常用參數

根據 [蘇洋博客的介紹](https://soulteary.com/2023/03/12/stable-web-terminal-services-using-docker-nginx-and-ttyd.html)，ttyd 提供了豐富的配置選項：

```bash
# 基本用法
ttyd -p 8080 bash

# 使用 Unix Socket
ttyd -i /tmp/ttyd.sock bash

# 只讀模式
ttyd -R bash

# 限制最大客戶端數量
ttyd -m 5 bash

# 基礎認證
ttyd -c username:password bash

# 自定義工作目錄
ttyd -w /home/user bash
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

4. **多層認證**: 結合 Cloudflare Access 和 HTTP Basic Auth
   ```bash
   # 在 ttyd 中啟用基礎認證
   ttyd -c admin:securepassword -i /tmp/ttyd.sock bash
   ```

### 高級安全措施

1. **二級代理**: 使用 Nginx 作為反向代理，提供額外的安全層
2. **日誌監控**: 啟用系統日誌監控，記錄所有終端活動
3. **定期更新**: 定期更新 ttyd、cloudflared 和系統軟件
4. **容器隔離**: 使用 Docker 容器提供額外的隔離層
5. **進程監控**: 使用 Supervisor 確保服務穩定運行

### 進程管理和監控

使用 Supervisor 管理 ttyd 進程的優勢：

- **自動重啟**: 進程異常退出時自動重啟
- **日誌管理**: 統一的日誌記錄和輪轉
- **狀態監控**: 實時監控進程狀態
- **批量管理**: 統一管理多個服務

檢查 Supervisor 管理的進程：

```bash
# 查看所有進程狀態
sudo supervisorctl status

# 重啟特定進程
sudo supervisorctl restart ttyd

# 查看進程日誌
sudo supervisorctl tail ttyd
```

## 故障排除

### 常見問題

#### ttyd 服務無法啟動

```bash
# 檢查服務狀態
sudo systemctl status ttyd

# 查看詳細日誌
sudo journalctl -u ttyd -f

# 檢查 Supervisor 狀態
sudo supervisorctl status ttyd
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

#### Docker 容器問題

```bash
# 檢查容器狀態
docker compose ps

# 查看容器日誌
docker compose logs nginx-terminal

# 重啟容器
docker compose restart
```

#### Unix Socket 權限問題

```bash
# 檢查 socket 文件權限
ls -la /tmp/ttyd.sock

# 修改權限
sudo chmod 666 /tmp/ttyd.sock
```

#### 無法訪問終端

1. 確認 DNS 記錄已正確設置
2. 檢查 Cloudflare Access 配置
3. 驗證 Google OAuth 設置
4. 檢查 Nginx 配置和認證文件
5. 確認防火牆設置

### 日誌位置

- ttyd 日誌: `sudo journalctl -u ttyd` 或 `/tmp/ttyd.log`
- cloudflared 日誌: `sudo journalctl -u cloudflared`
- Nginx 日誌: `docker compose logs nginx-terminal`
- Supervisor 日誌: `/var/log/supervisor/`
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

3. **更新 Docker 鏡像**
   ```bash
   docker compose pull
   docker compose up -d
   ```

4. **檢查服務狀態**
   ```bash
   sudo systemctl status ttyd cloudflared
   sudo supervisorctl status
   docker compose ps
   ```

5. **清理日誌**
   ```bash
   sudo journalctl --vacuum-time=7d
   sudo supervisorctl clear ttyd
   ```

### 備份重要配置

建議定期備份以下配置文件：
- `/etc/systemd/system/ttyd.service`
- `/etc/cloudflared/config.yml`
- `/etc/supervisor/conf.d/ttyd.conf`
- `~/.cloudflared/` 目錄
- `docker-compose.yml` 和 `nginx.conf`
- `.htpasswd` 認證文件

### 性能優化

1. **調整 ttyd 參數**
   ```bash
   # 增加 WebSocket ping 間隔
   ttyd -P 10 bash
   
   # 限制客戶端連接數
   ttyd -m 10 bash
   ```

2. **優化 Nginx 配置**
   ```nginx
   # 增加 worker 進程數
   worker_processes auto;
   
   # 調整連接數
   events {
       worker_connections 2048;
   }
   ```

3. **監控資源使用**
   ```bash
   # 監控 CPU 和內存使用
   htop
   
   # 監控網絡連接
   ss -tuln
   ```

## 擴展功能

### 多用戶支持

可以為不同用戶創建不同的 ttyd 實例：

```bash
# 為用戶 alice 創建實例
ttyd -i /tmp/ttyd-alice.sock -u alice bash

# 為用戶 bob 創建實例
ttyd -i /tmp/ttyd-bob.sock -u bob bash
```

### 自定義終端環境

```bash
# 使用 zsh 替代 bash
ttyd -i /tmp/ttyd.sock zsh

# 啟動時執行特定腳本
ttyd -i /tmp/ttyd.sock bash -c "source ~/.bashrc && bash"
```

### 集成其他工具

參考 [蘇洋博客的建議](https://soulteary.com/2023/03/12/stable-web-terminal-services-using-docker-nginx-and-ttyd.html)，ttyd 可以用於：

- **多用戶堡壘機**: 為不同用戶提供隔離的終端環境
- **遠程維護工具**: 在各種設備上提供統一的維護界面
- **實時日誌查看**: 結合 `tail -f` 等命令實時查看日誌
- **開發環境共享**: 讓團隊成員共享開發環境

## 參考資源

- [ttyd 官方文檔](https://github.com/tsl0922/ttyd)
- [Cloudflare Tunnel 文檔](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Cloudflare Access 文檔](https://developers.cloudflare.com/cloudflare-one/applications/)
- [Google OAuth 設置指南](https://developers.google.com/identity/protocols/oauth2)
- [蘇洋博客 - 使用 Docker、Nginx 和 ttyd 提供穩定的 Web 終端服務](https://soulteary.com/2023/03/12/stable-web-terminal-services-using-docker-nginx-and-ttyd.html)
- [Supervisor 官方文檔](http://supervisord.org/)
- [Nginx 官方文檔](https://nginx.org/en/docs/)

## 許可證

本文檔遵循 MIT 許可證。

