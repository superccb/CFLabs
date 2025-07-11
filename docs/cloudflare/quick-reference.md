# Cloudflare Serverless Quick Reference Guide

## Core Services Quick Start

### 🚀 Workers - Edge Computing Platform

#### Basic Worker Template
```javascript
export default {
  async fetch(request, env, ctx) {
    return new Response('Hello World!');
  }
};
```

#### Environment Configuration
```toml
# wrangler.toml
name = "my-worker"
main = "src/index.js"
compatibility_date = "2024-01-01"

[vars]
API_KEY = "your-api-key"

[[kv_namespaces]]
binding = "MY_KV"
id = "your-kv-id"
```

#### Common Commands
```bash
# Development
wrangler dev
wrangler dev --local

# Deployment
wrangler deploy
wrangler deploy --env production

# Logs
wrangler tail
wrangler tail --format pretty
```

---

### 💾 D1 - SQL Database

#### Database Operations
```javascript
// Query data
const users = await env.DB.prepare(
  "SELECT * FROM users WHERE status = ?"
).bind('active').all();

// Insert data
const result = await env.DB.prepare(
  "INSERT INTO users (name, email) VALUES (?, ?)"
).bind('John', 'john@example.com').run();

// Transaction
const { success } = await env.DB.batch([
  env.DB.prepare("UPDATE accounts SET balance = balance - ? WHERE id = ?").bind(100, 1),
  env.DB.prepare("UPDATE accounts SET balance = balance + ? WHERE id = ?").bind(100, 2)
]);
```

#### Schema Management
```bash
# Create database
wrangler d1 create my-db

# Execute SQL
wrangler d1 execute my-db --file=./schema.sql

# Backup
wrangler d1 export my-db --output=backup.sql
```

---

### 🗄️ R2 - Object Storage

#### Basic Operations
```javascript
// Upload file
await env.MY_BUCKET.put('file.txt', 'Hello World');

// Download file
const object = await env.MY_BUCKET.get('file.txt');
const text = await object.text();

// List objects
const objects = await env.MY_BUCKET.list();

// Delete object
await env.MY_BUCKET.delete('file.txt');
```

#### Presigned URLs
```javascript
// Generate presigned URL for upload
const url = await env.MY_BUCKET.createMultipartUpload('large-file.zip');

// Generate presigned URL for download
const url = await env.MY_BUCKET.createPresignedUrl('file.txt', 3600);
```

---

### 🔑 KV - Key-Value Storage

#### Basic Operations
```javascript
// Set value
await env.MY_KV.put('key', 'value');
await env.MY_KV.put('key', 'value', { expirationTtl: 3600 });

// Get value
const value = await env.MY_KV.get('key');
const value = await env.MY_KV.get('key', { type: 'json' });

// Get multiple values
const values = await env.MY_KV.getMany(['key1', 'key2', 'key3']);

// Delete value
await env.MY_KV.delete('key');
```

#### Batch Operations
```javascript
// Batch write
await env.MY_KV.put('key1', 'value1');
await env.MY_KV.put('key2', 'value2');
await env.MY_KV.put('key3', 'value3');

// Batch read
const values = await env.MY_KV.getMany(['key1', 'key2', 'key3']);
```

---

### 🤖 Workers AI - Edge AI

#### Text Generation
```javascript
import { Ai } from '@cloudflare/ai';

export default {
  async fetch(request, env) {
    const ai = new Ai(env.AI);
    
    const response = await ai.run('@cf/meta/llama-2-7b-chat-int8', {
      messages: [{ role: 'user', content: 'Hello!' }]
    });
    
    return Response.json(response);
  }
};
```

#### Image Generation
```javascript
const response = await ai.run('@cf/bytedance/stable-diffusion-xl-base-1.0', {
  prompt: 'A beautiful sunset over mountains'
});

return new Response(response, {
  headers: { 'content-type': 'image/png' }
});
```

#### Text-to-Speech
```javascript
const response = await ai.run('@cf/openai/tts-1', {
  text: 'Hello, this is a test message',
  voice: 'alloy'
});

return new Response(response, {
  headers: { 'content-type': 'audio/mpeg' }
});
```

---

### 📨 Queues - Message Queues

#### Producer
```javascript
// Send message
await env.MY_QUEUE.send({
  message: 'Hello from producer',
  timestamp: Date.now()
});

// Send batch
await env.MY_QUEUE.sendBatch([
  { body: 'Message 1' },
  { body: 'Message 2' },
  { body: 'Message 3' }
]);
```

#### Consumer
```javascript
export default {
  async queue(batch, env) {
    for (const message of batch.messages) {
      console.log('Processing:', message.body);
      // Process message
    }
  }
};
```

---

### 🔄 Durable Objects - State Management

#### Object Definition
```javascript
export class ChatRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.users = new Map();
  }

  async fetch(request) {
    const url = new URL(request.url);
    
    switch (url.pathname) {
      case '/join':
        return this.handleJoin(request);
      case '/message':
        return this.handleMessage(request);
      default:
        return new Response('Not found', { status: 404 });
    }
  }

  async handleJoin(request) {
    const user = await request.json();
    this.users.set(user.id, user);
    return Response.json({ success: true });
  }
}
```

#### Usage
```javascript
export default {
  async fetch(request, env) {
    const id = env.CHAT_ROOM.idFromName('room-1');
    const obj = env.CHAT_ROOM.get(id);
    return obj.fetch(request);
  }
};
```

---

## Development Tools

### 🛠️ Wrangler CLI Commands

#### Project Management
```bash
# Create new project
npm create cloudflare@latest my-project

# Login
wrangler login

# List projects
wrangler whoami
```

#### Development
```bash
# Start dev server
wrangler dev
wrangler dev --local

# Test specific environment
wrangler dev --env staging
```

#### Deployment
```bash
# Deploy
wrangler deploy
wrangler deploy --env production

# Rollback
wrangler rollback
wrangler rollback --env production
```

#### Database Management
```bash
# D1
wrangler d1 create my-db
wrangler d1 execute my-db --file=./schema.sql
wrangler d1 export my-db --output=backup.sql

# R2
wrangler r2 bucket create my-bucket
wrangler r2 object put my-bucket/file.txt ./file.txt
wrangler r2 object get my-bucket/file.txt

# KV
wrangler kv:namespace create MY_KV
wrangler kv:key put --binding=MY_KV key value
wrangler kv:key get --binding=MY_KV key
```

#### Secrets Management
```bash
# Set secret
wrangler secret put API_KEY

# List secrets
wrangler secret list

# Delete secret
wrangler secret delete API_KEY
```

---

### 📦 Vite Plugin

#### Configuration
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';

export default defineConfig({
  plugins: [cloudflare()],
  build: {
    target: 'esnext'
  }
});
```

#### Usage
```bash
# Build
npm run build

# Preview
npm run preview
```

---

## Common Patterns

### 🔐 Authentication

#### JWT Token Validation
```javascript
import jwt from 'jsonwebtoken';

function validateToken(token, secret) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}

export default {
  async fetch(request, env) {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const user = validateToken(token, env.JWT_SECRET);
    if (!user) {
      return new Response('Invalid token', { status: 401 });
    }
    
    // Process request
  }
};
```

#### Basic Auth
```javascript
function checkBasicAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return null;
  }
  
  const credentials = atob(authHeader.slice(6));
  const [username, password] = credentials.split(':');
  
  if (username === env.USERNAME && password === env.PASSWORD) {
    return { username };
  }
  
  return null;
}
```

---

### 📊 Caching Strategies

#### KV Caching
```javascript
async function getCachedData(key, env, fetchFunction) {
  // Try cache first
  let data = await env.CACHE.get(key, { type: 'json' });
  
  if (!data) {
    // Fetch fresh data
    data = await fetchFunction();
    
    // Cache for 1 hour
    await env.CACHE.put(key, JSON.stringify(data), { expirationTtl: 3600 });
  }
  
  return data;
}
```

#### Response Caching
```javascript
export default {
  async fetch(request, env) {
    const response = new Response('Hello World');
    
    // Cache for 5 minutes
    response.headers.set('Cache-Control', 'public, max-age=300');
    
    return response;
  }
};
```

---

### 🔄 Error Handling

#### Global Error Handler
```javascript
export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      console.error('Error:', error);
      
      return new Response('Internal Server Error', {
        status: 500,
        headers: { 'content-type': 'text/plain' }
      });
    }
  }
};
```

#### Custom Error Responses
```javascript
function createErrorResponse(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

// Usage
if (!user) {
  return createErrorResponse('User not found', 404);
}
```

---

### 📝 Logging

#### Structured Logging
```javascript
function log(level, message, data = {}) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data
  }));
}

// Usage
log('info', 'User created', { userId: 123, email: 'user@example.com' });
log('error', 'Database connection failed', { error: error.message });
```

#### Request Logging
```javascript
export default {
  async fetch(request, env) {
    const start = Date.now();
    
    // Process request
    const response = await handleRequest(request, env);
    
    const duration = Date.now() - start;
    console.log('Request processed', {
      method: request.method,
      url: request.url,
      status: response.status,
      duration: `${duration}ms`
    });
    
    return response;
  }
};
```

---

## Performance Optimization

### ⚡ Cold Start Optimization

#### Pre-warm Connections
```javascript
export default {
  async fetch(request, env) {
    // Pre-warm database connection
    await env.DB.prepare('SELECT 1').run();
    
    // Your logic here
  }
};
```

#### Lazy Loading
```javascript
// Load heavy modules only when needed
let heavyModule = null;

export default {
  async fetch(request, env) {
    if (!heavyModule) {
      heavyModule = await import('./heavy-module.js');
    }
    
    return heavyModule.process(request);
  }
};
```

---

### 🚀 Response Optimization

#### Streaming Responses
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
    
    return new Response(stream);
  }
};
```

#### Compression
```javascript
export default {
  async fetch(request, env) {
    const response = new Response('Large content here...');
    response.headers.set('Content-Encoding', 'gzip');
    
    return response;
  }
};
```

---

## Security Best Practices

### 🛡️ Input Validation

#### Schema Validation
```javascript
function validateUser(data) {
  const errors = [];
  
  if (!data.name || data.name.length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  
  if (!data.email || !data.email.includes('@')) {
    errors.push('Valid email is required');
  }
  
  if (data.age && (data.age < 0 || data.age > 150)) {
    errors.push('Age must be between 0 and 150');
  }
  
  return errors;
}
```

#### SQL Injection Prevention
```javascript
// Use prepared statements
const user = await env.DB.prepare(
  "SELECT * FROM users WHERE id = ?"
).bind(userId).first();

// Don't do this
const user = await env.DB.prepare(
  `SELECT * FROM users WHERE id = ${userId}`
).first();
```

---

### 🔒 Rate Limiting

#### Simple Rate Limiter
```javascript
async function rateLimit(request, env) {
  const ip = request.headers.get('CF-Connecting-IP');
  const key = `rate_limit:${ip}`;
  
  const current = await env.KV.get(key) || 0;
  if (current > 100) {
    return new Response('Rate limit exceeded', { status: 429 });
  }
  
  await env.KV.put(key, current + 1, { expirationTtl: 60 });
  return null;
}
```

---

## Monitoring and Debugging

### 📊 Metrics Collection

#### Custom Metrics
```javascript
export default {
  async fetch(request, env) {
    const start = Date.now();
    
    // Your logic here
    
    const duration = Date.now() - start;
    env.ANALYTICS.writeDataPoint({
      blobs: ['api_request'],
      doubles: [duration],
      indexes: ['endpoint']
    });
    
    return response;
  }
};
```

---

### 🐛 Debugging

#### Debug Mode
```bash
# Enable debug logging
wrangler dev --inspect

# View detailed logs
wrangler tail --format pretty
```

#### Error Tracking
```javascript
export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      // Log error details
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        url: request.url,
        method: request.method,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }
};
```

---

## Common Issues and Solutions

### ❗ Cold Start Issues
- **Problem**: First request is slow
- **Solution**: Pre-warm connections and use lazy loading

### 💾 Memory Issues
- **Problem**: Memory limit exceeded
- **Solution**: Optimize data structures and use streaming

### 🔗 Database Connection Issues
- **Problem**: Connection timeouts
- **Solution**: Use connection pooling and retry logic

### 📡 Network Issues
- **Problem**: Request timeouts
- **Solution**: Implement proper timeout handling and circuit breakers

---

## Useful Resources

### 📚 Documentation
- [Workers Documentation](https://developers.cloudflare.com/workers/)
- [D1 Documentation](https://developers.cloudflare.com/d1/)
- [R2 Documentation](https://developers.cloudflare.com/r2/)
- [AI Documentation](https://developers.cloudflare.com/ai/)

### 🛠️ Tools
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Vite Plugin](https://developers.cloudflare.com/workers/wrangler/vite/)
- [Workers Playground](https://cloudflareworkers.com/)

### 💡 Examples
- [Workers Examples](https://github.com/cloudflare/workers-examples)
- [AI Examples](https://github.com/cloudflare/workers-ai-examples)
- [Agents Examples](https://github.com/cloudflare/agents-examples)

---

*Last Updated: 2025-01-06*  
*Maintained by: Development Team* 