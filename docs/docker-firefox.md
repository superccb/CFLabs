# 在 VPS 上使用 Docker 遠端啟動 Firefox 瀏覽器（含 Web 圖形介面）

本指南適用於希望在 VPS（雲端主機）上，通過 Docker 快速部署 Firefox 圖形瀏覽器，並能以 VNC/noVNC（Web）方式遠端訪問的用戶。適合開發測試、臨時瀏覽、雲端桌面等場景。

---

## 目錄

1. [推薦方案：Docker + Firefox + VNC/noVNC](#推薦方案docker--firefox--x11--vnc--novncweb遠端訪問)
2. [直接使用官方鏡像（最簡單）](#1-直接使用官方鏡像推薦)
3. [自定義 Dockerfile（進階用戶）](#2-自定義-dockerfile如你想要自己定制)
4. [啟用 Web 瀏覽訪問（noVNC）](#3-開啟-web-瀏覽訪問加上-novnc)
5. [安全提醒與加固建議](#安全提醒)
6. [常見問題 FAQ](#常見問題-faq)
7. [測試與清理命令](#🧪-測試地址例)
8. [方案對比總結](#✅-總結)
9. [版本與更新資訊](#版本與更新資訊)

---

## ✅ 推薦方案：Docker + Firefox + X11 + VNC + noVNC（Web遠端訪問）

推薦使用開源專案 `jlesage/firefox`，內建 Firefox + VNC/noVNC，開箱即用。

---

### 1. 直接使用官方鏡像（推薦）

#### ✅ 快速啟動命令（無需 Dockerfile）：

```bash
docker run -d \
  --name=firefox \
  -p 5800:5800 \
  -v /docker/appdata/firefox:/config:rw \
  jlesage/firefox
```

- **Web 訪問方式**：瀏覽器打開 `http://你的VPS-IP:5800` 即可看到 Firefox 圖形介面（noVNC）。
- **端口說明**：5800（Web/noVNC），5900（VNC 客戶端，需額外開啟）。
- **數據持久化**：Firefox 配置與資料將保存在 `/docker/appdata/firefox`，可自訂路徑。
- **資源需求**：建議 VPS 至少 1GB 記憶體。

---

### 2. 自定義 Dockerfile（如需進階自訂）

如需完全自訂環境，可參考以下 Dockerfile：

```dockerfile
FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

# 安裝 Firefox 及必要元件
RUN apt-get update && apt-get install -y \
    firefox \
    x11vnc \
    xvfb \
    fluxbox \
    wget \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# 建立啟動腳本
RUN mkdir -p /opt/scripts
COPY startup.sh /opt/scripts/startup.sh
RUN chmod +x /opt/scripts/startup.sh

# Supervisor 設定
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 5900 6080

CMD ["/usr/bin/supervisord"]
```

#### `startup.sh`（啟動 Firefox + VNC 腳本）

```bash
#!/bin/bash
# 啟動 Xvfb（虛擬 X server）
Xvfb :1 -screen 0 1024x768x16 &

# 設定顯示變數
export DISPLAY=:1

# 啟動視窗管理器
fluxbox &

# 啟動 Firefox
firefox &

# 啟動 VNC 伺服器
x11vnc -display :1 -forever -nopw -shared &
```

#### `supervisord.conf`

```ini
[supervisord]
nodaemon=true

[program:startup]
command=/opt/scripts/startup.sh
```

#### 構建與運行自定義鏡像

```bash
# 構建鏡像
sudo docker build -t myfirefox .

# 運行容器
sudo docker run -d --name=firefox -p 5900:5900 myfirefox
```

---

### 3. 開啟 Web 瀏覽訪問（加上 noVNC）

如需直接用瀏覽器訪問（無需 VNC 客戶端），可加裝 noVNC：

```bash
# 安裝 noVNC
RUN git clone https://github.com/novnc/noVNC.git /opt/novnc \
 && git clone https://github.com/novnc/websockify /opt/novnc/utils/websockify

# 啟動腳本加一行
/opt/novnc/utils/launch.sh --vnc localhost:5900 &
```

---

## 🔐 安全提醒

- **切勿直接暴露 5800/5900 端口於公網**，建議使用 Cloudflare Tunnel、SSH 隧道或設置密碼。
- 預設無認證，請加強防火牆規則、Nginx Basic Auth 或 Cloudflare Zero Trust。
- 可參考 [noVNC 官方文檔](https://novnc.com/info.html) 設置密碼。

---

## 常見問題 FAQ

**Q1：啟動後無法訪問 5800 端口？**
- 檢查 VPS 防火牆是否開放 5800 端口。
- 檢查容器是否正常運行：`docker ps`。

**Q2：Firefox 啟動很慢或閃退？**
- 檢查 VPS 記憶體是否足夠（建議 1GB+）。
- 嘗試重啟容器。

**Q3：如何設置 VNC/noVNC 密碼？**
- 可在啟動腳本中加入 `-passwd yourpassword` 參數。
- 參考 noVNC/x11vnc 官方文檔。

**Q4：如何自訂數據保存路徑？**
- 修改 `-v /docker/appdata/firefox:/config:rw` 中左側路徑即可。

---

## 🧪 測試地址（例）

假設你的 VPS IP 為 `1.2.3.4`，執行：

```bash
docker run -d -p 5800:5800 jlesage/firefox
```

然後瀏覽器訪問 `http://1.2.3.4:5800`。

### 停止並清理容器

```bash
docker stop firefox && docker rm firefox
```

---

## ✅ 總結

| 方式                              | 是否推薦  | 是否支援 Web 訪問 | 難度   | 備註           |
| --------------------------------- | ------- | -------------- | ------ | -------------- |
| 用 jlesage/firefox                | ✅ 推薦  | ✅（5800 端口）  | 最簡單 | 開箱即用        |
| 自訂 Dockerfile + VNC/noVNC       | 適合進階 | ✅ 可加 noVNC    | 中等   | 可高度自訂      |
| ttyd + CLI 瀏覽器（w3m/lynx）     | ❌ 不推薦 | ❌ 無 GUI        | 最輕量 | 僅文字瀏覽      |

---

## 版本與更新資訊

- 適用鏡像版本：`jlesage/firefox:latest`（測試於 2024-06）
- 最後更新時間：2024-06

