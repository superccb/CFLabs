# VPS 分佈式監控系統與 Cloudflare Workers 整合方案

## 概述

本文介紹如何構建一個安全的分佈式VPS監控系統，使用 Cloudflare Workers 作為數據聚合和展示平台，通過 Cloudflare Access 和 Tunnel 技術確保監控接口的安全性。

### 技術棧

- **VPS 監控接口**: Node.js/Python FastAPI 監控服務
- **Cloudflare Tunnel**: 建立安全隧道，暴露監控接口
- **Cloudflare Access**: 身份驗證和訪問控制
- **Cloudflare Workers**: 數據聚合和監控儀表板
- **Cloudflare KV**: 監控數據存儲
- **JSON Web Token (JWT)**: 接口認證

### 核心特性

- ✅ 多VPS分佈式監控
- ✅ 零端口直接暴露，僅通過 CF Tunnel 訪問
- ✅ 基於 CF Access 的安全認證
- ✅ 實時監控數據聚合
- ✅ 響應式監控儀表板
- ✅ API 密鑰管理
- ✅ 歷史數據存儲
- ✅ 告警和通知系統

## 架構設計

### 系統架構概覽

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│  VPS 1 (監控API)     │    │  VPS 2 (監控API)     │    │  VPS N (監控API)     │
│  localhost:3000     │    │  localhost:3000     │    │  localhost:3000     │
└─────────┬───────────┘    └─────────┬───────────┘    └─────────┬───────────┘
          │                          │                          │
          │ CF Tunnel               │ CF Tunnel               │ CF Tunnel
          ▼                          ▼                          ▼
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│ health1.gygy.com    │    │ health2.gygy.com    │    │ healthN.gygy.com    │
└─────────┬───────────┘    └─────────┬───────────┘    └─────────┬───────────┘
          │                          │                          │
          │                          │                          │
          └─────────────┬────────────┘                          │
                        │                                       │
                        │              CF Access 控制             │
                        └─────────────────┬─────────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────┐
                        │      CF Workers 監控平台             │
                        │  - 數據聚合                         │
                        │  - 儀表板頁面                       │
                        │  - API 端點                         │
                        └─────────────────────────────────────┘
                                          │
                                          ▼
                        ┌─────────────────────────────────────┐
                        │    dashboard.gygy.com               │
                        │    (用戶監控界面)                   │
                        └─────────────────────────────────────┘
```

### 安全架構設計

#### 1. 多層安全防護

- **網絡層**: 所有監控服務僅綁定 localhost，通過 CF Tunnel 訪問
- **認證層**: CF Access 控制域名訪問權限
- **應用層**: JWT Token 認證，確保只有授權的 CF Workers 可以訪問
- **傳輸層**: 全程 HTTPS 加密

#### 2. 訪問控制流程

```
用戶請求 → CF Access 驗證 → CF Workers → JWT 驗證 → VPS 監控接口 → 數據返回
```

#### 3. 安全憑證管理

- **API 密鑰**: 使用 CF Workers 環境變量存儲
- **JWT 密鑰**: 各 VPS 共享統一的 JWT 密鑰
- **域名訪問**: 僅允許特定的 CF Workers 域名訪問

## VPS 監控接口實現

### Node.js 監控服務示例

```javascript
// monitor-service.js
const express = require('express');
const jwt = require('jsonwebtoken');
const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

// JWT 中間件
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// 系統信息收集
const getSystemInfo = async () => {
    const { stdout: diskUsage } = await exec('df -h / | tail -1');
    const { stdout: memInfo } = await exec('free -m');
    const { stdout: loadAvg } = await exec('uptime');
    
    return {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        uptime: os.uptime(),
        loadavg: os.loadavg(),
        totalmem: os.totalmem(),
        freemem: os.freemem(),
        cpus: os.cpus().length,
        diskUsage: diskUsage.trim(),
        memInfo: memInfo,
        loadAvg: loadAvg.trim(),
        timestamp: new Date().toISOString()
    };
};

// 監控數據端點
app.get('/api/health', authenticateToken, async (req, res) => {
    try {
        const systemInfo = await getSystemInfo();
        res.json({
            status: 'healthy',
            server: req.get('host'),
            data: systemInfo
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// 簡單的健康檢查
app.get('/ping', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        server: os.hostname()
    });
});

// 啟動服務
app.listen(PORT, '127.0.0.1', () => {
    console.log(`監控服務運行在 http://127.0.0.1:${PORT}`);
});
```

### Python FastAPI 監控服務示例

```python
# monitor_service.py
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import psutil
import platform
import subprocess
import json
from datetime import datetime
import os
from typing import Optional

app = FastAPI(title="VPS 監控服務", version="1.0.0")
security = HTTPBearer()

JWT_SECRET = os.getenv('JWT_SECRET', 'your-jwt-secret-key')

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_system_info():
    """收集系統信息"""
    try:
        # CPU 信息
        cpu_percent = psutil.cpu_percent(interval=1)
        cpu_count = psutil.cpu_count()
        
        # 記憶體信息
        memory = psutil.virtual_memory()
        
        # 磁碟信息
        disk = psutil.disk_usage('/')
        
        # 網絡信息
        network = psutil.net_io_counters()
        
        # 系統負載
        load_avg = os.getloadavg()
        
        return {
            "hostname": platform.node(),
            "platform": platform.platform(),
            "architecture": platform.architecture()[0],
            "cpu": {
                "count": cpu_count,
                "percent": cpu_percent,
                "load_avg": load_avg
            },
            "memory": {
                "total": memory.total,
                "available": memory.available,
                "percent": memory.percent,
                "used": memory.used,
                "free": memory.free
            },
            "disk": {
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "percent": (disk.used / disk.total) * 100
            },
            "network": {
                "bytes_sent": network.bytes_sent,
                "bytes_recv": network.bytes_recv,
                "packets_sent": network.packets_sent,
                "packets_recv": network.packets_recv
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error collecting system info: {str(e)}")

@app.get("/api/health")
async def health_check(user = Depends(verify_token)):
    """主要監控數據端點"""
    system_info = get_system_info()
    return {
        "status": "healthy",
        "server": platform.node(),
        "data": system_info
    }

@app.get("/ping")
async def ping():
    """簡單的健康檢查"""
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "server": platform.node()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=3000)
```

### 監控服務部署配置

#### package.json (Node.js)

```json
{
  "name": "vps-monitor",
  "version": "1.0.0",
  "description": "VPS 監控服務",
  "main": "monitor-service.js",
  "scripts": {
    "start": "node monitor-service.js",
    "dev": "nodemon monitor-service.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

#### requirements.txt (Python)

```txt
fastapi==0.104.1
uvicorn==0.24.0
psutil==5.9.6
PyJWT==2.8.0
python-multipart==0.0.6
```

#### systemd 服務配置

```ini
# /etc/systemd/system/vps-monitor.service
[Unit]
Description=VPS Monitor Service
After=network.target

[Service]
Type=simple
User=monitor
WorkingDirectory=/opt/vps-monitor
Environment=JWT_SECRET=your-secret-key-here
ExecStart=/usr/bin/node monitor-service.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## Cloudflare Workers 監控平台

### 主要 Worker 腳本

```javascript
// worker.js
const JWT_SECRET = 'your-jwt-secret-key';

// 生成 JWT Token
function generateToken() {
    const header = {
        alg: 'HS256',
        typ: 'JWT'
    };
    
    const payload = {
        iss: 'cf-workers-monitor',
        aud: 'vps-monitor',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1小時過期
        iat: Math.floor(Date.now() / 1000)
    };
    
    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '');
    
    const signature = btoa(hmacSha256(JWT_SECRET, `${encodedHeader}.${encodedPayload}`)).replace(/=/g, '');
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// HMAC SHA256 實現
async function hmacSha256(key, message) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const messageData = encoder.encode(message);
    
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    return String.fromCharCode(...new Uint8Array(signature));
}

// VPS 監控端點配置
const VPS_ENDPOINTS = [
    { name: 'VPS-1', url: 'https://health1.gygy.com/api/health' },
    { name: 'VPS-2', url: 'https://health2.gygy.com/api/health' },
    { name: 'VPS-3', url: 'https://health3.gygy.com/api/health' }
];

// 獲取所有 VPS 監控數據
async function fetchAllMonitoringData() {
    const token = await generateToken();
    const promises = VPS_ENDPOINTS.map(async (endpoint) => {
        try {
            const response = await fetch(endpoint.url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            return {
                name: endpoint.name,
                url: endpoint.url,
                status: 'online',
                data: data
            };
        } catch (error) {
            return {
                name: endpoint.name,
                url: endpoint.url,
                status: 'offline',
                error: error.message
            };
        }
    });
    
    const results = await Promise.all(promises);
    return results;
}

// 生成監控儀表板 HTML
function generateDashboardHTML(monitoringData) {
    const serverCards = monitoringData.map(server => {
        const statusClass = server.status === 'online' ? 'online' : 'offline';
        const statusText = server.status === 'online' ? '在線' : '離線';
        
        let serverInfo = '';
        if (server.status === 'online' && server.data && server.data.data) {
            const data = server.data.data;
            serverInfo = `
                <div class="server-info">
                    <div class="info-item">
                        <span class="label">主機名:</span>
                        <span class="value">${data.hostname || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">CPU 使用率:</span>
                        <span class="value">${data.cpu ? data.cpu.percent + '%' : 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">記憶體使用:</span>
                        <span class="value">${data.memory ? data.memory.percent + '%' : 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">磁碟使用:</span>
                        <span class="value">${data.disk ? data.disk.percent.toFixed(1) + '%' : 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">系統負載:</span>
                        <span class="value">${data.cpu && data.cpu.load_avg ? data.cpu.load_avg.slice(0, 3).map(l => l.toFixed(2)).join(', ') : 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">最後更新:</span>
                        <span class="value">${data.timestamp ? new Date(data.timestamp).toLocaleString('zh-TW') : 'N/A'}</span>
                    </div>
                </div>
            `;
        } else if (server.status === 'offline') {
            serverInfo = `
                <div class="server-info">
                    <div class="error-message">
                        錯誤: ${server.error || '無法連接到服務器'}
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="server-card ${statusClass}">
                <div class="server-header">
                    <h3>${server.name}</h3>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                ${serverInfo}
            </div>
        `;
    }).join('');
    
    return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VPS 監控儀表板</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .header .subtitle {
            color: #7f8c8d;
            font-size: 16px;
        }
        
        .dashboard {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
        }
        
        .server-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-left: 4px solid #ddd;
        }
        
        .server-card.online {
            border-left-color: #27ae60;
        }
        
        .server-card.offline {
            border-left-color: #e74c3c;
        }
        
        .server-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .server-header h3 {
            color: #2c3e50;
            font-size: 18px;
        }
        
        .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .status-badge.online {
            background: #d4edda;
            color: #155724;
        }
        
        .status-badge.offline {
            background: #f8d7da;
            color: #721c24;
        }
        
        .server-info {
            space-y: 8px;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        
        .info-item:last-child {
            border-bottom: none;
        }
        
        .label {
            font-weight: 500;
            color: #555;
        }
        
        .value {
            font-family: monospace;
            color: #333;
        }
        
        .error-message {
            color: #e74c3c;
            font-style: italic;
            text-align: center;
            padding: 20px;
        }
        
        .refresh-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            font-size: 20px;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        
        .refresh-button:hover {
            background: #2980b9;
        }
        
        .last-updated {
            text-align: center;
            margin-top: 20px;
            color: #7f8c8d;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>VPS 監控儀表板</h1>
            <p class="subtitle">實時監控所有 VPS 服務器狀態</p>
        </div>
        
        <div class="dashboard">
            ${serverCards}
        </div>
        
        <div class="last-updated">
            最後更新: ${new Date().toLocaleString('zh-TW')}
        </div>
    </div>
    
    <button class="refresh-button" onclick="location.reload()">
        ↻
    </button>
    
    <script>
        // 每30秒自動刷新
        setInterval(() => {
            location.reload();
        }, 30000);
    </script>
</body>
</html>
    `;
}

// 主要請求處理
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    
    // 路由處理
    if (url.pathname === '/') {
        // 返回監控儀表板
        const monitoringData = await fetchAllMonitoringData();
        const html = generateDashboardHTML(monitoringData);
        
        return new Response(html, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    }
    
    if (url.pathname === '/api/status') {
        // 返回 JSON 格式的監控數據
        const monitoringData = await fetchAllMonitoringData();
        
        return new Response(JSON.stringify(monitoringData, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    }
    
    // 404 處理
    return new Response('Not Found', { status: 404 });
}
```

### wrangler.toml 配置

```toml
name = "vps-monitor-dashboard"
main = "worker.js"
compatibility_date = "2024-01-01"

[env.production]
routes = [
  "dashboard.gygy.com/*"
]

[env.production.vars]
JWT_SECRET = "your-jwt-secret-key-here"
```

## 部署指南

### 第一步：準備 VPS 監控服務

#### 1. 安裝依賴和配置服務

```bash
# 在每個 VPS 上執行
sudo apt update && sudo apt install -y nodejs npm python3-pip

# 創建監控服務目錄
sudo mkdir -p /opt/vps-monitor
sudo chown $USER:$USER /opt/vps-monitor
cd /opt/vps-monitor

# 複製監控服務代碼
# (將上面的 monitor-service.js 或 monitor_service.py 複製到此目錄)

# Node.js 版本
npm install express jsonwebtoken

# Python 版本
pip3 install fastapi uvicorn psutil PyJWT
```

#### 2. 配置 systemd 服務

```bash
# 創建服務文件
sudo nano /etc/systemd/system/vps-monitor.service

# 將上面的 systemd 配置複製到文件中，並修改 JWT_SECRET

# 啟動服務
sudo systemctl daemon-reload
sudo systemctl enable vps-monitor
sudo systemctl start vps-monitor

# 檢查服務狀態
sudo systemctl status vps-monitor
```

#### 3. 測試本地服務

```bash
# 測試 ping 端點
curl http://127.0.0.1:3000/ping

# 生成測試 JWT Token (使用 Node.js)
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign({}, 'your-jwt-secret-key', { expiresIn: '1h' });
console.log('Bearer ' + token);
"

# 測試認證端點
curl -H "Authorization: Bearer YOUR_TOKEN" http://127.0.0.1:3000/api/health
```

### 第二步：配置 Cloudflare Tunnel

#### 1. 為每個 VPS 創建 Tunnel

```bash
# 在 VPS 1 上
cloudflared tunnel create vps1-health
cloudflared tunnel route dns vps1-health health1.gygy.com

# 在 VPS 2 上
cloudflared tunnel create vps2-health
cloudflared tunnel route dns vps2-health health2.gygy.com

# 在 VPS 3 上
cloudflared tunnel create vps3-health
cloudflared tunnel route dns vps3-health health3.gygy.com
```

#### 2. 配置 Tunnel 設定

```bash
# 在每個 VPS 上創建配置文件
sudo nano /etc/cloudflared/config.yml
```

```yaml
# VPS 1 配置
tunnel: vps1-health
credentials-file: /home/user/.cloudflared/vps1-health.json

ingress:
  - hostname: health1.gygy.com
    service: http://localhost:3000
  - service: http_status:404
```

#### 3. 啟動 Tunnel 服務

```bash
# 在每個 VPS 上啟動
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared

# 檢查服務狀態
sudo systemctl status cloudflared
```

### 第三步：配置 Cloudflare Access

#### 1. 創建 Access 應用程序

1. 登入 [Cloudflare Zero Trust](https://one.dash.cloudflare.com/)
2. 選擇 **Access** → **Applications** → **Add Application**
3. 選擇 **Self-hosted**
4. 配置應用程序信息：
   - **Name**: `VPS Health Monitors`
   - **Domains**: 
     - `health1.gygy.com`
     - `health2.gygy.com`
     - `health3.gygy.com`

#### 2. 配置訪問策略

1. 創建策略規則：
   - **Policy name**: `CF Workers Only`
   - **Decision**: `Allow`
   - **Rules**: 
     - Include: `Service Auth`
     - Create Service Token for CF Workers

#### 3. 獲取 Service Token

1. 在 **Access** → **Service Auth** → **Service Tokens**
2. 創建新的 Service Token
3. 記錄 `Client ID` 和 `Client Secret`

### 第四步：部署 CF Workers

#### 1. 安裝 Wrangler

```bash
npm install -g wrangler
wrangler login
```

#### 2. 創建 Worker 項目

```bash
mkdir vps-monitor-dashboard
cd vps-monitor-dashboard

# 複製 worker.js 和 wrangler.toml 到此目錄
```

#### 3. 配置環境變量

```bash
# 設置 JWT 密鑰
wrangler secret put JWT_SECRET

# 設置 Service Token (如果使用)
wrangler secret put CF_ACCESS_CLIENT_ID
wrangler secret put CF_ACCESS_CLIENT_SECRET
```

#### 4. 部署 Worker

```bash
wrangler publish --env production
```

### 第五步：測試和驗證

#### 1. 測試監控接口

```bash
# 測試各個健康檢查端點
curl https://health1.gygy.com/ping
curl https://health2.gygy.com/ping
curl https://health3.gygy.com/ping
```

#### 2. 測試 Worker 儀表板

```bash
# 訪問監控儀表板
curl https://dashboard.gygy.com/

# 測試 API 端點
curl https://dashboard.gygy.com/api/status
```

#### 3. 驗證安全性

```bash
# 嘗試直接訪問監控接口（應該被 Access 攔截）
curl -I https://health1.gygy.com/api/health

# 檢查 Worker 是否能正常獲取數據
curl https://dashboard.gygy.com/api/status | jq
```

## 安全性最佳實踐

### 1. JWT Token 管理

- 使用強隨機密鑰
- 設置適當的過期時間
- 定期輪換密鑰
- 在 Worker 中實現 Token 緩存

### 2. Cloudflare Access 設定

- 限制 Service Token 的有效期
- 定期審查訪問日誌
- 使用最小權限原則
- 配置 IP 白名單（如果需要）

### 3. 監控服務加固

- 使用專用用戶運行服務
- 限制文件系統訪問權限
- 配置防火牆規則
- 啟用系統日誌記錄

### 4. 網絡安全

- 確保所有服務僅綁定 localhost
- 使用 TLS 1.3 加密
- 配置 HSTS 頭部
- 實施 CORS 策略

## 故障排除

### 常見問題和解決方案

#### 1. JWT 認證失敗

```bash
# 檢查 JWT 密鑰是否一致
grep JWT_SECRET /etc/systemd/system/vps-monitor.service
wrangler secret list

# 檢查 Token 生成和驗證
node -e "
const jwt = require('jsonwebtoken');
const secret = 'your-secret';
const token = jwt.sign({test: true}, secret);
console.log('Generated:', token);
const decoded = jwt.verify(token, secret);
console.log('Verified:', decoded);
"
```

#### 2. Cloudflare Tunnel 連接問題

```bash
# 檢查 Tunnel 狀態
cloudflared tunnel list
cloudflared tunnel info vps1-health

# 檢查配置文件
sudo cat /etc/cloudflared/config.yml

# 查看 Tunnel 日誌
sudo journalctl -u cloudflared -f
```

#### 3. 監控服務異常

```bash
# 檢查服務狀態
sudo systemctl status vps-monitor

# 查看服務日誌
sudo journalctl -u vps-monitor -f

# 檢查端口綁定
sudo netstat -tlnp | grep :3000
```

#### 4. CF Workers 部署問題

```bash
# 檢查 Worker 日誌
wrangler tail

# 測試 Worker 功能
wrangler dev

# 檢查環境變量
wrangler secret list
```

### 監控和告警

#### 1. 系統監控腳本

```bash
#!/bin/bash
# monitor-check.sh

SERVICES=("vps-monitor" "cloudflared")
ENDPOINTS=("http://127.0.0.1:3000/ping")

for service in "${SERVICES[@]}"; do
    if ! systemctl is-active --quiet "$service"; then
        echo "ALERT: $service is not running"
        # 發送告警通知
    fi
done

for endpoint in "${ENDPOINTS[@]}"; do
    if ! curl -s "$endpoint" > /dev/null; then
        echo "ALERT: $endpoint is not responding"
        # 發送告警通知
    fi
done
```

#### 2. 定期健康檢查

```bash
# 添加到 crontab
crontab -e

# 每5分鐘檢查一次
*/5 * * * * /opt/vps-monitor/monitor-check.sh
```

## 總結

本文提供了一個完整的 VPS 分佈式監控解決方案，結合 Cloudflare Workers 和 Tunnel 技術，實現了安全、高效的監控數據聚合和展示。

### 主要優勢

1. **安全性**: 零端口暴露，多層身份驗證
2. **擴展性**: 輕鬆添加新的 VPS 監控節點
3. **可用性**: 基於 Cloudflare 的高可用性架構
4. **易用性**: 直觀的 Web 儀表板界面

### 後續改進建議

1. **數據存儲**: 集成 Cloudflare KV 存儲歷史數據
2. **告警系統**: 添加基於閾值的告警機制
3. **數據分析**: 實施趨勢分析和預測功能
4. **移動適配**: 優化移動設備用戶體驗
5. **API 擴展**: 提供更豐富的 REST API 端點

通過這套方案，你可以建立一個企業級的 VPS 監控平台，兼顧安全性、可用性和易用性。 