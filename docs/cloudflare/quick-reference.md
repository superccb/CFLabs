# Cloudflare Serverless 快速參考指南

## 常用命令

### Wrangler CLI
```bash
# 項目管理
wrangler init my-project
wrangler dev
wrangler deploy
wrangler tail

# 環境管理
wrangler secret put MY_SECRET
wrangler secret list
wrangler secret delete MY_SECRET

# 數據庫 (D1)
wrangler d1 create my-db
wrangler d1 execute my-db --local --file=./schema.sql
wrangler d1 migrations create my-db create_table
wrangler d1 migrations apply my-db

# 存儲 (KV)
wrangler kv:namespace create MY_KV
wrangler kv:key put --binding=MY_KV key value
wrangler kv:key get --binding=MY_KV key
wrangler kv:key list --binding=MY_KV

# 存儲 (R2)
wrangler r2 bucket create my-bucket
wrangler r2 object put my-bucket/key ./file.txt
wrangler r2 object get my-bucket/key
wrangler r2 object list my-bucket
```

### 項目模板
```bash
# 基本 Worker
npm create cloudflare@latest my-worker

# AI Agent
npm create cloudflare@latest -- --template cloudflare/agents-starter

# 全棧應用
npm create cloudflare@latest -- --template cloudflare/workers-typescript
```

---

## 配置文件範例

### 基本 wrangler.toml
```toml
name = "my-worker"
main = "src/index.js"
compatibility_date = "2024-01-01"

[env.production]
name = "my-worker-prod"

[env.staging]
name = "my-worker-staging"
```

### 包含所有服務的配置
```toml
name = "full-stack-app"
main = "src/index.js"
compatibility_date = "2024-01-01"

# 環境變量
[vars]
API_KEY = "your-api-key"
ENVIRONMENT = "development"

# AI 服務
[[ai]]
binding = "AI"

# 數據庫
[[d1_databases]]
binding = "DB"
database_name = "my-db"
database_id = "xxx"

# 對象存儲
[[r2_buckets]]
binding = "MY_BUCKET"
bucket_name = "my-bucket"

# 鍵值存儲
[[kv_namespaces]]
binding = "MY_KV"
id = "xxx"
preview_id = "yyy"

# 隊列
[[queues.producers]]
binding = "MY_QUEUE"
queue = "my-queue"

[[queues.consumers]]
queue = "my-queue"
max_batch_size = 10

# Durable Objects
[[durable_objects.bindings]]
name = "CHAT_ROOM"
class_name = "ChatRoom"

[[migrations]]
tag = "v1"
new_classes = ["ChatRoom"]

# 分析
[[analytics_engine_datasets]]
binding = "ANALYTICS"

# 圖像處理
[[images]]
binding = "IMAGES"
```

---

## 常用代碼片段

### 基本 Worker
```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 路由處理
    switch (url.pathname) {
      case '/':
        return new Response('Hello World!');
      case '/api/users':
        return handleUsers(request, env);
      default:
        return new Response('Not Found', { status: 404 });
    }
  },
};
```

### 數據庫查詢
```javascript
// D1 查詢
const { results } = await env.DB.prepare(
  "SELECT * FROM users WHERE id = ?"
).bind(userId).all();

// 插入數據
await env.DB.prepare(
  "INSERT INTO users (name, email) VALUES (?, ?)"
).bind(name, email).run();

// 事務
await env.DB.batch([
  env.DB.prepare("INSERT INTO users (name) VALUES (?)").bind("John"),
  env.DB.prepare("INSERT INTO profiles (user_id) VALUES (last_insert_rowid())")
]);
```

### AI 調用
```javascript
import { Ai } from '@cloudflare/ai';

const ai = new Ai(env.AI);

// 文本生成
const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
  messages: [{ role: 'user', content: 'Hello!' }]
});

// 圖像生成
const image = await ai.run('@cf/lykon/dreamshaper-8', {
  prompt: "A beautiful landscape"
});

// 語音轉文字
const transcription = await ai.run('@cf/openai/whisper', {
  audio: audioData
});
```

### 文件操作
```javascript
// R2 上傳
const object = await env.MY_BUCKET.put('key', fileData, {
  httpMetadata: { contentType: 'image/jpeg' }
});

// R2 下載
const file = await env.MY_BUCKET.get('key');
if (file) {
  return new Response(file.body, {
    headers: { 'content-type': file.httpMetadata?.contentType }
  });
}

// KV 操作
await env.MY_KV.put('key', 'value');
const value = await env.MY_KV.get('key');
```

### WebSocket 處理
```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/ws') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      
      server.accept();
      server.addEventListener('message', event => {
        server.send(JSON.stringify({ echo: event.data }));
      });
      
      return new Response(null, { status: 101, webSocket: client });
    }
    
    return new Response('WebSocket endpoint: /ws');
  },
};
```

### 隊列處理
```javascript
// 生產者
export default {
  async fetch(request, env) {
    await env.MY_QUEUE.send({
      message: 'Hello from producer',
      timestamp: Date.now()
    });
    return new Response('Message sent');
  },
};

// 消費者
export default {
  async queue(batch, env) {
    for (const message of batch.messages) {
      console.log('Processing:', message.body);
      // 處理消息邏輯
    }
  },
};
```

---

## 錯誤處理模式

### 基本錯誤處理
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

### 路由錯誤處理
```javascript
export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      
      // 路由邏輯
      switch (url.pathname) {
        case '/api/users':
          return await handleUsers(request, env);
        default:
          return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      if (error.message.includes('not found')) {
        return new Response('Resource not found', { status: 404 });
      }
      
      console.error('Unexpected error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
```

---

## 性能優化技巧

### 緩存策略
```javascript
export default {
  async fetch(request, env) {
    const cacheKey = new Request(request.url, request);
    const cache = caches.default;
    
    // 檢查緩存
    let response = await cache.match(cacheKey);
    if (response) {
      return response;
    }
    
    // 生成響應
    response = new Response('Cached content');
    
    // 設置緩存
    response.headers.set('Cache-Control', 'max-age=3600');
    await cache.put(cacheKey, response.clone());
    
    return response;
  },
};
```

### 批量處理
```javascript
// 批量數據庫操作
const batch = [
  env.DB.prepare("INSERT INTO users (name) VALUES (?)").bind("John"),
  env.DB.prepare("INSERT INTO users (name) VALUES (?)").bind("Jane"),
  env.DB.prepare("INSERT INTO users (name) VALUES (?)").bind("Bob")
];

await env.DB.batch(batch);
```

### 串流處理
```javascript
export default {
  async fetch(request, env) {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue('Hello ');
        controller.enqueue('World!');
        controller.close();
      }
    });
    
    return new Response(stream, {
      headers: { 'content-type': 'text/plain' }
    });
  },
};
```

---

## 環境變量管理

### 開發環境
```bash
# .dev.vars
API_KEY=dev_key_123
DATABASE_URL=sqlite:./dev.db
```

### 生產環境
```bash
# 設置密鑰
wrangler secret put API_KEY
wrangler secret put DATABASE_URL
```

### 環境特定配置
```toml
# wrangler.toml
[vars]
ENVIRONMENT = "development"

[env.production.vars]
ENVIRONMENT = "production"

[env.staging.vars]
ENVIRONMENT = "staging"
```

---

## 調試技巧

### 本地開發
```bash
# 啟動本地開發服務器
wrangler dev

# 查看日誌
wrangler tail

# 測試特定環境
wrangler dev --env production
```

### 日誌記錄
```javascript
export default {
  async fetch(request, env) {
    console.log('Request URL:', request.url);
    console.log('Request method:', request.method);
    
    // 結構化日誌
    console.log('Processing request', {
      url: request.url,
      method: request.method,
      timestamp: new Date().toISOString()
    });
    
    return new Response('Logged');
  },
};
```

---

## 常用第三方整合

### 外部 API 調用
```javascript
export default {
  async fetch(request, env) {
    const response = await fetch('https://api.example.com/data', {
      headers: {
        'Authorization': `Bearer ${env.API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return Response.json(data);
  },
};
```

### CORS 處理
```javascript
export default {
  async fetch(request, env) {
    // 處理 CORS 預檢請求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
    
    const response = new Response('API Response');
    response.headers.set('Access-Control-Allow-Origin', '*');
    
    return response;
  },
};
```

---

*最後更新: 2025-01-06*  
*文檔維護: 開發團隊* 