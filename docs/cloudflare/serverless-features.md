# Cloudflare Serverless 開發功能完整列表

## 概述

本文檔整理了 Cloudflare 平台提供的所有 Serverless 開發功能，包括核心服務、AI 能力、數據存儲、開發工具等。這些功能可以單獨使用或組合使用，構建完整的無伺服器應用。

---

## 核心運行時

### 1. Cloudflare Workers

**描述**: 全球邊緣計算平台，在 200+ 城市運行 JavaScript/TypeScript 代碼

**主要特性**:
- 全球部署，自動路由到最近的邊緣節點
- 支持 JavaScript、TypeScript、Rust、Python
- 冷啟動時間 < 1ms
- CPU 時間限制：5分鐘（2025年更新）
- 記憶體：128MB

**基本用法**:
```javascript
export default {
  async fetch(request, env, ctx) {
    return new Response('Hello World!', {
      headers: { 'content-type': 'text/plain' },
    });
  },
};
```

**部署命令**:
```bash
# 安裝 Wrangler CLI
npm install -g wrangler

# 登入
wrangler login

# 開發
wrangler dev

# 部署
wrangler deploy
```

**配置範例** (`wrangler.toml`):
```toml
name = "my-worker"
main = "src/index.js"
compatibility_date = "2024-01-01"

[env.production]
name = "my-worker-prod"

[env.staging]
name = "my-worker-staging"
```

---

### 2. Cloudflare Pages

**描述**: 靜態網站託管和全棧應用平台

**主要特性**:
- 自動構建和部署
- 支持 React、Vue、Svelte 等框架
- 內建 Functions 支持
- 自定義域名和 SSL
- 分支預覽

**框架支持**:
- React (Next.js, Remix)
- Vue (Nuxt)
- Svelte (SvelteKit)
- Astro
- Hono

**配置範例** (`wrangler.toml`):
```toml
[build]
command = "npm run build"
output_directory = "dist"

[build.environment]
NODE_VERSION = "18"

[[redirects]]
from = "/api/*"
to = "/api/:splat"
status = 200
```

---

## AI 與機器學習

### 3. Workers AI

**描述**: 邊緣 AI 推理服務，支持多種 AI 模型

**支持模型**:
- **文本生成**: Llama 3.1, DeepSeek, Mistral, Phi-3
- **圖像生成**: Stable Diffusion XL, DeepSeek
- **語音轉文字**: Whisper
- **文字轉語音**: Coqui TTS
- **嵌入**: text-embedding-3-small

**基本用法**:
```javascript
import { Ai } from '@cloudflare/ai';

export default {
  async fetch(request, env) {
    const ai = new Ai(env.AI);
    
    // 文本生成
    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: 'Hello!' }]
    });
    
    return Response.json(response);
  },
};
```

**高級功能**:
```javascript
// 串流響應
const stream = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
  messages: [{ role: 'user', content: 'Tell me a story' }],
  stream: true
});

// 工具調用
const response = await ai.run('@cf/openai/gpt-4o-mini', {
  messages: [{ role: 'user', content: 'What\'s the weather?' }],
  tools: [{
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string' }
        }
      }
    }
  }]
});
```

**配置** (`wrangler.toml`):
```toml
[[ai]]
binding = "AI"
```

---

### 4. AI Agents SDK

**描述**: 構建智能 Agent 的框架

**主要特性**:
- 多 Agent 系統支持
- 人機協作流程
- 可尋址 Agent
- 持久化執行

**基本 Agent**:
```javascript
import { Agent } from 'agents-sdk';

export class ChatAgent extends Agent {
  async onChatMessage(onFinish) {
    return agentContext.run(this, async () => {
      const result = streamText({
        model: openai("gpt-4o-2024-11-20"),
        system: "You are a helpful assistant.",
        messages: this.messages,
        onFinish,
        maxSteps: 10,
      });
      
      result.mergeIntoDataStream(dataStream);
    });
  }
}
```

**實時 Agent**:
```javascript
export class RealtimeAgent extends Agent {
  async onConnect(connection, ctx) {
    const agent = new RealtimeAgent({
      instructions: "You are a helpful assistant...",
      name: "Triage Agent",
    });
  }
}
```

**安裝**:
```bash
npm i agents-sdk
npm create cloudflare@latest -- --template cloudflare/agents-starter
```

---

## 數據存儲

### 5. D1 Database

**描述**: 基於 SQLite 的邊緣數據庫

**主要特性**:
- 全球分佈式
- SQL 查詢
- 事務支持
- 自動備份

**基本用法**:
```javascript
export default {
  async fetch(request, env) {
    const { results } = await env.DB.prepare(
      "SELECT * FROM users WHERE id = ?"
    ).bind(1).all();
    
    return Response.json(results);
  },
};
```

**遷移管理**:
```bash
# 創建遷移
wrangler d1 migrations create DB create_users_table

# 應用遷移
wrangler d1 migrations apply DB

# 本地開發
wrangler d1 execute DB --local --file=./schema.sql
```

**配置** (`wrangler.toml`):
```toml
[[d1_databases]]
binding = "DB"
database_name = "my-db"
database_id = "xxx"
```

---

### 6. R2 Storage

**描述**: S3 兼容的對象存儲服務

**主要特性**:
- S3 API 兼容
- 無出口費用
- 全球分佈
- 自動 CDN

**基本用法**:
```javascript
export default {
  async fetch(request, env) {
    // 上傳文件
    const object = await env.MY_BUCKET.put('key', 'value', {
      httpMetadata: { contentType: 'text/plain' }
    });
    
    // 下載文件
    const file = await env.MY_BUCKET.get('key');
    
    // 列出對象
    const list = await env.MY_BUCKET.list();
    
    return Response.json({ success: true });
  },
};
```

**配置** (`wrangler.toml`):
```toml
[[r2_buckets]]
binding = "MY_BUCKET"
bucket_name = "my-bucket"
```

---

### 7. KV Storage

**描述**: 鍵值對存儲服務

**主要特性**:
- 低延遲讀取
- 全球分佈
- 簡單的鍵值 API

**基本用法**:
```javascript
export default {
  async fetch(request, env) {
    // 寫入
    await env.MY_KV.put('key', 'value');
    
    // 讀取
    const value = await env.MY_KV.get('key');
    
    // 列出鍵
    const keys = await env.MY_KV.list();
    
    return Response.json({ value });
  },
};
```

**配置** (`wrangler.toml`):
```toml
[[kv_namespaces]]
binding = "MY_KV"
id = "xxx"
preview_id = "yyy"
```

---

### 8. Durable Objects

**描述**: 強一致性狀態管理

**主要特性**:
- 強一致性
- 狀態持久化
- 實時協作
- 唯一性保證

**基本用法**:
```javascript
// 定義 Durable Object
export class ChatRoom extends DurableObject {
  constructor(state, env) {
    super(state, env);
    this.users = new Map();
  }
  
  async fetch(request) {
    const url = new URL(request.url);
    
    if (url.pathname === '/websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      
      server.accept();
      server.addEventListener('message', event => {
        // 處理消息
        server.send(JSON.stringify({ message: event.data }));
      });
      
      return new Response(null, { status: 101, webSocket: client });
    }
    
    return new Response('Chat Room');
  }
}

// 使用 Durable Object
export default {
  async fetch(request, env) {
    const id = env.CHAT_ROOM.idFromName('room1');
    const obj = env.CHAT_ROOM.get(id);
    return obj.fetch(request);
  },
};
```

**配置** (`wrangler.toml`):
```toml
[[durable_objects.bindings]]
name = "CHAT_ROOM"
class_name = "ChatRoom"

[[migrations]]
tag = "v1"
new_classes = ["ChatRoom"]
```

---

### 9. Hyperdrive

**描述**: 連接外部數據庫的服務

**支持數據庫**:
- PostgreSQL
- MySQL
- SQLite

**基本用法**:
```javascript
export default {
  async fetch(request, env) {
    const { results } = await env.DB.prepare(
      "SELECT * FROM users WHERE id = ?"
    ).bind(1).all();
    
    return Response.json(results);
  },
};
```

**配置** (`wrangler.toml`):
```toml
[[hyperdrive]]
binding = "DB"
id = "xxx"
```

---

## 消息與隊列

### 10. Queues

**描述**: 異步消息隊列服務

**主要特性**:
- 可靠傳遞
- 批量處理
- 重試機制
- 死信隊列

**生產者**:
```javascript
export default {
  async fetch(request, env) {
    await env.MY_QUEUE.send({
      message: 'Hello from producer',
      timestamp: Date.now()
    });
    
    return new Response('Message sent');
  },
};
```

**消費者**:
```javascript
export default {
  async queue(batch, env) {
    for (const message of batch.messages) {
      console.log('Processing:', message.body);
      // 處理消息
    }
  },
};
```

**配置** (`wrangler.toml`):
```toml
[[queues.producers]]
binding = "MY_QUEUE"
queue = "my-queue"

[[queues.consumers]]
queue = "my-queue"
max_batch_size = 10
max_batch_timeout = 30
```

---

### 11. Pub/Sub

**描述**: 發布/訂閱消息服務

**基本用法**:
```javascript
// 發布者
export default {
  async fetch(request, env) {
    await env.MY_PUBSUB.publish('channel1', {
      message: 'Hello subscribers!',
      timestamp: Date.now()
    });
    
    return new Response('Published');
  },
};

// 訂閱者
export default {
  async fetch(request, env) {
    const subscription = await env.MY_PUBSUB.subscribe('channel1');
    
    return new Response(subscription.readable, {
      headers: { 'content-type': 'text/event-stream' }
    });
  },
};
```

**配置** (`wrangler.toml`):
```toml
[[pubsub]]
binding = "MY_PUBSUB"
```

---

## 容器與運行時

### 12. Cloudflare Containers

**描述**: 容器化應用部署服務

**主要特性**:
- 全球部署 (Region: Earth)
- 與 Workers 整合
- 按需計費
- 多種實例類型

**實例類型**:
| 類型 | 記憶體 | CPU | 磁盤 |
|------|--------|-----|------|
| dev | 256 MiB | 1/16 vCPU | 2 GB |
| basic | 1 GiB | 1/4 vCPU | 4 GB |
| standard | 4 GiB | 1/2 vCPU | 4 GB |

**基本用法**:
```javascript
export class MyContainer extends Container {
  defaultPort = 8080;
  sleepAfter = '5m';
}
```

**配置** (`wrangler.toml`):
```toml
[[containers]]
class_name = "MyContainer"
image = "./Dockerfile"
max_instances = 80
instance_type = "basic"
```

---

## 開發工具

### 13. Wrangler CLI

**描述**: Cloudflare 開發命令行工具

**主要命令**:
```bash
# 項目管理
wrangler init my-project
wrangler dev
wrangler deploy

# 數據庫管理
wrangler d1 execute DB --local --file=./schema.sql
wrangler d1 migrations apply DB

# 存儲管理
wrangler kv:key put --binding=MY_KV key value
wrangler r2 object put my-bucket/key ./file.txt

# 監控
wrangler tail
wrangler analytics
```

---

### 14. Cloudflare Vite Plugin

**描述**: Vite 構建工具整合

**安裝**:
```bash
npm install -D @cloudflare/vite-plugin
```

**配置** (`vite.config.js`):
```javascript
import { defineConfig } from 'vite';
import cloudflare from '@cloudflare/vite-plugin';

export default defineConfig({
  plugins: [cloudflare()],
  build: {
    target: 'esnext',
  },
});
```

---

## 安全與認證

### 15. Access

**描述**: 零信任身份驗證服務

**基本用法**:
```javascript
export default {
  async fetch(request, env) {
    // 檢查用戶身份
    const user = await env.AUTH.getUserInfo(request);
    
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    return Response.json({ user });
  },
};
```

**配置** (`wrangler.toml`):
```toml
[[access]]
binding = "AUTH"
```

---

### 16. Turnstile

**描述**: 隱私友好的 CAPTCHA 替代方案

**基本用法**:
```javascript
export default {
  async fetch(request, env) {
    const formData = await request.formData();
    const token = formData.get('cf-turnstile-response');
    
    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET,
        response: token,
      }),
    });
    
    const outcome = await result.json();
    
    if (outcome.success) {
      return new Response('Verification successful');
    } else {
      return new Response('Verification failed', { status: 400 });
    }
  },
};
```

---

## 監控與分析

### 17. Analytics Engine

**描述**: 實時數據分析服務

**基本用法**:
```javascript
export default {
  async fetch(request, env) {
    // 記錄事件
    env.ANALYTICS.writeDataPoint({
      blobs: ['page_view', '/home'],
      doubles: [1],
      indexes: ['page']
    });
    
    return new Response('Analytics recorded');
  },
};
```

**配置** (`wrangler.toml`):
```toml
[[analytics_engine_datasets]]
binding = "ANALYTICS"
```

---

### 18. Logpush

**描述**: 日誌推送服務

**配置** (`wrangler.toml`):
```toml
[logpush]
destination = "https://your-endpoint.com/logs"
```

---

## 整合服務

### 19. Email Routing

**描述**: 電子郵件路由服務

**基本用法**:
```javascript
export default {
  async fetch(request, env) {
    const email = await request.json();
    
    // 處理收到的郵件
    console.log('From:', email.from);
    console.log('To:', email.to);
    console.log('Subject:', email.subject);
    console.log('Body:', email.text);
    
    return new Response('Email processed');
  },
};
```

---

### 20. Images

**描述**: 圖像處理和優化服務

**基本用法**:
```javascript
export default {
  async fetch(request, env) {
    const image = await env.IMAGES.get('image-id');
    
    // 調整大小
    const resized = await image.resize({
      width: 300,
      height: 200,
      fit: 'cover'
    });
    
    return new Response(resized, {
      headers: { 'content-type': 'image/jpeg' }
    });
  },
};
```

**配置** (`wrangler.toml`):
```toml
[[images]]
binding = "IMAGES"
```

---

## 開發最佳實踐

### 項目結構建議
```
my-worker/
├── src/
│   ├── index.js          # 主入口
│   ├── api/              # API 路由
│   ├── utils/            # 工具函數
│   └── types/            # TypeScript 類型
├── wrangler.toml         # 配置文件
├── package.json
└── README.md
```

### 環境變量管理
```toml
# wrangler.toml
[vars]
API_KEY = "your-api-key"
ENVIRONMENT = "production"

[env.staging.vars]
ENVIRONMENT = "staging"
```

### 錯誤處理
```javascript
export default {
  async fetch(request, env) {
    try {
      // 你的邏輯
      return new Response('Success');
    } catch (error) {
      console.error('Error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
```

### 性能優化
- 使用緩存減少重複計算
- 批量處理數據庫操作
- 利用 Durable Objects 進行狀態管理
- 使用串流處理大數據

---

## 學習資源

### 官方文檔
- [Workers 文檔](https://developers.cloudflare.com/workers/)
- [AI 文檔](https://developers.cloudflare.com/ai/)
- [數據庫文檔](https://developers.cloudflare.com/d1/)
- [存儲文檔](https://developers.cloudflare.com/r2/)

### 範例項目
- [Workers Examples](https://github.com/cloudflare/workers-examples)
- [AI Examples](https://github.com/cloudflare/workers-ai-examples)
- [Agents Examples](https://github.com/cloudflare/agents-examples)

### 社群資源
- [Cloudflare Discord](https://discord.cloudflare.com/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/cloudflare-workers)
- [Reddit r/Cloudflare](https://www.reddit.com/r/cloudflare/)

---

*最後更新: 2025-01-06*  
*文檔維護: 開發團隊* 