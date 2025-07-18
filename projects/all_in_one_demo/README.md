# Cloudflare Workers AI 進階應用：馬拉松系統 AI 增強版

## 概述

本文在原有的馬拉松報名與通知系統基礎上，整合 Cloudflare Workers AI 的機器學習模型，包括文生圖、函數調用、文本生成等功能，打造一個更智能、更個性化的馬拉松管理系統。

## 系統架構升級

### 新增 AI 服務層
在原有微服務架構基礎上，我們加入：

- **AI 內容生成 Worker**：負責生成個人化海報、證書等圖像內容
- **智能助手 Worker**：提供問答服務、賽事建議等功能
- **AI 分析 Worker**：分析跑者數據、預測完賽時間等

### AI 功能整合架構圖
```
前端界面 → 報名處理 Worker → AI 內容生成 Worker
    ↓              ↓              ↓
 靜態資源      D1 資料庫      Workers AI (文生圖)
    ↓              ↓              ↓
後台管理 → 智能助手 Worker → AI 分析 Worker
    ↓              ↓              ↓
 管理界面      函數調用      模型推理服務
```

## 核心 AI 功能實作

### 1. 文生圖功能 - 個人化海報生成

#### 配置設定

**wrangler.toml 檔案中添加 AI 綁定**
```toml
# Workers AI 綁定
[ai]
binding = "AI"

# 如果需要存儲生成的圖像
[[r2_buckets]]
binding = "IMAGES_BUCKET"
bucket_name = "marathon-images"
```

#### 文生圖 Worker 實作

```typescript
import { Ai } from '@cloudflare/ai';

interface Env {
  AI: Ai;
  IMAGES_BUCKET: R2Bucket;
  DB: D1Database;
}

export class AIImageWorker extends WorkerEntrypoint<Env> {
  
  /**
   * 為跑者生成個人化完賽海報
   * @param runnerData 跑者資料
   * @param raceResult 比賽結果
   * @returns 生成的圖像 URL
   */
  async generateFinishPoster(runnerData: any, raceResult: any): Promise<string> {
    const prompt = `
      Create a professional marathon finish poster with:
      - Runner name: ${runnerData.firstName} ${runnerData.lastName}
      - Finish time: ${raceResult.finishTime}
      - Distance: ${runnerData.distance}
      - Position: ${raceResult.position}
      - Beautiful marathon scenery background
      - Celebratory and professional design
      - High quality, photo-realistic style
    `;

    try {
      // 使用 Stable Diffusion XL 生成圖像
      const response = await this.env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
        prompt: prompt,
        num_steps: 20,
        guidance: 7.5,
        width: 1024,
        height: 768
      });

      // 將圖像存儲到 R2
      const imageBuffer = response as ArrayBuffer;
      const imageKey = `posters/${runnerData.id}-${Date.now()}.png`;
      
      await this.env.IMAGES_BUCKET.put(imageKey, imageBuffer, {
        httpMetadata: {
          contentType: 'image/png',
        },
      });

      // 返回圖像 URL
      return `https://images.marathon.workers.dev/${imageKey}`;
    } catch (error) {
      console.error('Failed to generate poster:', error);
      throw new Error('Image generation failed');
    }
  }

  /**
   * 生成賽事宣傳海報
   */
  async generateEventPoster(eventDetails: any): Promise<string> {
    const prompt = `
      Create a vibrant marathon event poster with:
      - Event name: ${eventDetails.name}
      - Date: ${eventDetails.date}
      - Location: ${eventDetails.location}
      - Registration info
      - Modern, energetic design
      - Running theme with city skyline
      - Bright colors and motivational feel
    `;

    const response = await this.env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
      prompt: prompt,
      num_steps: 25,
      guidance: 8.0,
      width: 1024,
      height: 1024
    });

    const imageBuffer = response as ArrayBuffer;
    const imageKey = `events/${eventDetails.id}-poster.png`;
    
    await this.env.IMAGES_BUCKET.put(imageKey, imageBuffer, {
      httpMetadata: {
        contentType: 'image/png',
      },
    });

    return `https://images.marathon.workers.dev/${imageKey}`;
  }

  /**
   * 圖像到圖像轉換 - 證書設計
   */
  async generateCertificate(templateImage: ArrayBuffer, runnerData: any): Promise<string> {
    const prompt = `
      Transform this template into a professional marathon certificate for:
      - ${runnerData.firstName} ${runnerData.lastName}
      - Distance: ${runnerData.distance}
      - Keep the original layout but add runner information
      - Professional, elegant design
    `;

    const response = await this.env.AI.run('@cf/runwayml/stable-diffusion-v1-5-img2img', {
      prompt: prompt,
      image: templateImage,
      num_steps: 20,
      guidance: 7.0,
      strength: 0.7
    });

    const imageBuffer = response as ArrayBuffer;
    const imageKey = `certificates/${runnerData.id}-certificate.png`;
    
    await this.env.IMAGES_BUCKET.put(imageKey, imageBuffer, {
      httpMetadata: {
        contentType: 'image/png',
      },
    });

    return `https://images.marathon.workers.dev/${imageKey}`;
  }
}
```

### 2. 函數調用功能 - 智能客服助手

#### 函數調用工具配置

```typescript
import { Ai } from '@cloudflare/ai';

interface Env {
  AI: Ai;
  DB: D1Database;
  REGISTRATION_QUEUE: Queue;
}

export class AIAssistantWorker extends WorkerEntrypoint<Env> {
  
  /**
   * 定義可調用的函數工具
   */
  private getAvailableTools() {
    return [
      {
        name: "get_registration_info",
        description: "獲取跑者的報名信息",
        parameters: {
          type: "object",
          properties: {
            email: {
              type: "string",
              description: "跑者的電子郵件地址"
            }
          },
          required: ["email"]
        }
      },
      {
        name: "update_runner_info",
        description: "更新跑者的報名信息",
        parameters: {
          type: "object",
          properties: {
            email: { type: "string", description: "跑者郵件" },
            field: { type: "string", description: "要更新的字段" },
            value: { type: "string", description: "新的值" }
          },
          required: ["email", "field", "value"]
        }
      },
      {
        name: "get_race_schedule",
        description: "獲取比賽時間表和相關信息",
        parameters: {
          type: "object",
          properties: {
            distance: {
              type: "string",
              description: "馬拉松距離（如：full, half, 10K）"
            }
          }
        }
      },
      {
        name: "send_notification",
        description: "發送通知給跑者",
        parameters: {
          type: "object",
          properties: {
            email: { type: "string", description: "跑者郵件" },
            message: { type: "string", description: "通知內容" }
          },
          required: ["email", "message"]
        }
      }
    ];
  }

  /**
   * 執行函數調用
   */
  private async executeFunction(functionName: string, args: any): Promise<any> {
    switch (functionName) {
      case 'get_registration_info':
        return await this.getRegistrationInfo(args.email);
      
      case 'update_runner_info':
        return await this.updateRunnerInfo(args.email, args.field, args.value);
      
      case 'get_race_schedule':
        return await this.getRaceSchedule(args.distance);
      
      case 'send_notification':
        return await this.sendNotification(args.email, args.message);
      
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
  }

  /**
   * 智能助手主要處理函數
   */
  async handleQuery(userMessage: string, userEmail?: string): Promise<string> {
    const systemPrompt = `
      你是一個專業的馬拉松賽事助手。你可以：
      1. 查詢和更新跑者報名信息
      2. 提供比賽時間表和相關信息
      3. 發送通知給跑者
      4. 回答關於馬拉松的一般問題
      
      請用友好、專業的語調回答問題。如果需要執行特定操作，請使用提供的函數。
    `;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ];

    try {
      // 使用支持函數調用的模型
      const response = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: messages,
        tools: this.getAvailableTools(),
        max_tokens: 1000
      });

      // 檢查是否有函數調用請求
      const choice = response.choices[0];
      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        const toolCall = choice.message.tool_calls[0];
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        // 執行函數調用
        const functionResult = await this.executeFunction(functionName, functionArgs);
        
        // 將函數結果返回給模型以生成最終回應
        const followUpMessages = [
          ...messages,
          choice.message,
          {
            role: "tool",
            content: JSON.stringify(functionResult),
            tool_call_id: toolCall.id
          }
        ];
        
        const finalResponse = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
          messages: followUpMessages,
          max_tokens: 1000
        });
        
        return finalResponse.choices[0].message.content;
      }
      
      return choice.message.content;
    } catch (error) {
      console.error('AI Assistant error:', error);
      return '抱歉，我暫時無法處理您的請求。請稍後再試。';
    }
  }

  // 輔助函數實作
  private async getRegistrationInfo(email: string): Promise<any> {
    const result = await this.env.DB.prepare(
      'SELECT * FROM runners WHERE email = ?'
    ).bind(email).first();
    
    return result || { error: '找不到該跑者的報名信息' };
  }

  private async updateRunnerInfo(email: string, field: string, value: string): Promise<any> {
    const allowedFields = ['firstName', 'lastName', 'address', 'distance'];
    
    if (!allowedFields.includes(field)) {
      return { error: '不允許更新該字段' };
    }

    const result = await this.env.DB.prepare(
      `UPDATE runners SET ${field} = ? WHERE email = ?`
    ).bind(value, email).run();
    
    return result.success ? { success: true } : { error: '更新失敗' };
  }

  private async getRaceSchedule(distance?: string): Promise<any> {
    const schedules = {
      'full': {
        distance: '42.195K',
        startTime: '07:00',
        cutoffTime: '6小時',
        startingArea: 'A區'
      },
      'half': {
        distance: '21.0975K',
        startTime: '07:30',
        cutoffTime: '3小時',
        startingArea: 'B區'
      },
      '10K': {
        distance: '10K',
        startTime: '08:00',
        cutoffTime: '1.5小時',
        startingArea: 'C區'
      }
    };

    return distance ? schedules[distance] || { error: '未找到該距離的賽程' } : schedules;
  }

  private async sendNotification(email: string, message: string): Promise<any> {
    await this.env.REGISTRATION_QUEUE.send(JSON.stringify({
      email,
      message,
      type: 'custom_notification'
    }));
    
    return { success: true, message: '通知已發送' };
  }
}
```

### 3. 主系統整合

#### 更新主報名 Worker

```typescript
import { Hono } from 'hono';
import { AIImageWorker } from './ai-image-worker';
import { AIAssistantWorker } from './ai-assistant-worker';

interface Env {
  AI: Ai;
  DB: D1Database;
  IMAGES_BUCKET: R2Bucket;
  REGISTRATION_QUEUE: Queue;
  AI_IMAGE_WORKER: AIImageWorker;
  AI_ASSISTANT_WORKER: AIAssistantWorker;
}

const app = new Hono<{ Bindings: Env }>();

// 原有的報名處理端點
app.post("/api/marathon-signup", async (c) => {
  const { firstName, lastName, email, address, distance } = await c.req.json();

  // 插入資料庫
  const result = await c.env.DB.prepare(
    `INSERT INTO runners (firstName, lastName, email, address, distance) 
     VALUES (?, ?, ?, ?, ?) RETURNING *`
  ).bind(firstName, lastName, email, address, distance).first();

  // 異步生成歡迎海報
  c.executionCtx.waitUntil(
    c.env.AI_IMAGE_WORKER.generateFinishPoster(result, { 
      finishTime: 'TBD',
      position: 'TBD'
    })
  );

  // 發送確認郵件
  await c.env.REGISTRATION_QUEUE.send(JSON.stringify({
    firstName,
    email,
    type: 'registration_confirmation'
  }));

  return c.json({
    message: "報名成功！",
    runnerId: result.id
  });
});

// 新增：AI 助手查詢端點
app.post("/api/ai-assistant", async (c) => {
  const { message, userEmail } = await c.req.json();
  
  const response = await c.env.AI_ASSISTANT_WORKER.handleQuery(message, userEmail);
  
  return c.json({ response });
});

// 新增：生成完賽海報端點
app.post("/api/generate-poster", async (c) => {
  const { runnerId, finishTime, position } = await c.req.json();
  
  // 獲取跑者資料
  const runnerData = await c.env.DB.prepare(
    'SELECT * FROM runners WHERE id = ?'
  ).bind(runnerId).first();

  if (!runnerData) {
    return c.json({ error: '找不到跑者資料' }, 404);
  }

  const posterUrl = await c.env.AI_IMAGE_WORKER.generateFinishPoster(
    runnerData,
    { finishTime, position }
  );

  return c.json({ posterUrl });
});

// 新增：生成賽事宣傳海報端點
app.post("/api/generate-event-poster", async (c) => {
  const eventDetails = await c.req.json();
  
  const posterUrl = await c.env.AI_IMAGE_WORKER.generateEventPoster(eventDetails);
  
  return c.json({ posterUrl });
});

// 新增：AI 數據分析端點
app.get("/api/ai-analytics", async (c) => {
  // 獲取所有跑者數據
  const runners = await c.env.DB.prepare(
    'SELECT distance, COUNT(*) as count FROM runners GROUP BY distance'
  ).all();

  const analysisPrompt = `
    分析以下馬拉松報名數據：
    ${JSON.stringify(runners.results)}
    
    請提供：
    1. 參賽人數分佈分析
    2. 各距離項目的受歡迎程度
    3. 對賽事組織的建議
    4. 預測完賽率
  `;

  const analysis = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      { role: "system", content: "你是一個專業的馬拉松數據分析師" },
      { role: "user", content: analysisPrompt }
    ],
    max_tokens: 1000
  });

  return c.json({
    data: runners.results,
    analysis: analysis.choices[0].message.content
  });
});

export default app;
```

## 進階 AI 功能

### 4. 圖像分析與處理

#### 跑者照片分析

```typescript
// 分析跑者上傳的訓練照片
app.post("/api/analyze-training-photo", async (c) => {
  const formData = await c.req.formData();
  const imageFile = formData.get('image') as File;
  
  if (!imageFile) {
    return c.json({ error: '請上傳圖片' }, 400);
  }

  const imageBuffer = await imageFile.arrayBuffer();
  
  // 使用 Workers AI 進行圖像分析
  const analysis = await c.env.AI.run('@cf/microsoft/resnet-50', {
    image: imageBuffer
  });

  // 生成訓練建議
  const advicePrompt = `
    根據以下圖像分析結果，為馬拉松跑者提供訓練建議：
    ${JSON.stringify(analysis)}
  `;

  const advice = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      { role: "system", content: "你是一個專業的馬拉松教練" },
      { role: "user", content: advicePrompt }
    ],
    max_tokens: 500
  });

  return c.json({
    analysis: analysis,
    advice: advice.choices[0].message.content
  });
});
```

### 5. 多語言支援

#### 自動翻譯功能

```typescript
// 多語言通知系統
app.post("/api/send-multilingual-notification", async (c) => {
  const { runnerId, message, language } = await c.req.json();
  
  const runner = await c.env.DB.prepare(
    'SELECT * FROM runners WHERE id = ?'
  ).bind(runnerId).first();

  if (!runner) {
    return c.json({ error: '找不到跑者' }, 404);
  }

  // 翻譯消息
  const translatedMessage = await c.env.AI.run('@cf/meta/m2m100-1.2b', {
    text: message,
    source_lang: 'zh',
    target_lang: language
  });

  // 發送翻譯後的通知
  await c.env.REGISTRATION_QUEUE.send(JSON.stringify({
    email: runner.email,
    message: translatedMessage.translated_text,
    type: 'multilingual_notification'
  }));

  return c.json({ success: true });
});
```

## 部署配置

### 更新 wrangler.toml

```toml
name = "marathon-ai-system"
main = "src/index.ts"
compatibility_date = "2024-03-01"
compatibility_flags = ["nodejs_compat"]

# Workers AI 綁定
[ai]
binding = "AI"

# D1 資料庫
[[d1_databases]]
binding = "DB"
database_name = "marathon-db"
database_id = "your-database-id"

# R2 儲存桶用於圖像
[[r2_buckets]]
binding = "IMAGES_BUCKET"
bucket_name = "marathon-images"

# Queue 配置
[[queues.producers]]
queue = "registration-queue"
binding = "REGISTRATION_QUEUE"

[[queues.consumers]]
queue = "registration-queue"
max_retries = 10
max_batch_size = 10

# 服務綁定
[[services]]
binding = "AI_IMAGE_WORKER"
service = "ai-image-worker"

[[services]]
binding = "AI_ASSISTANT_WORKER"
service = "ai-assistant-worker"

# 環境變數
[vars]
ENVIRONMENT = "production"
```

## 成本優化建議

### AI 使用優化

1. **圖像生成優化**
   - 使用較少的步數進行快速原型
   - 實施圖像快取機制
   - 批次處理圖像生成請求

2. **模型選擇**
   - 根據任務選擇合適的模型大小
   - 使用較小的模型進行實時交互
   - 較大模型用於批次處理

3. **快取策略**
   ```typescript
   // 實施結果快取
   const cacheKey = `poster-${runnerId}-${finishTime}`;
   const cached = await c.env.CACHE.get(cacheKey);
   
   if (cached) {
     return c.json({ posterUrl: cached });
   }
   
   // 生成新海報...
   await c.env.CACHE.put(cacheKey, posterUrl, { expirationTtl: 86400 });
   ```

## 監控與分析

### AI 性能監控

```typescript
// 添加 AI 操作的追蹤
const aiOperationSpan = tracer.startSpan('AI: Generate Poster');
aiOperationSpan.setAttributes({
  'ai.model': '@cf/stabilityai/stable-diffusion-xl-base-1.0',
  'ai.operation': 'text-to-image',
  'runner.id': runnerId
});

try {
  const result = await c.env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
    prompt: prompt,
    num_steps: 20
  });
  
  aiOperationSpan.setStatus({ code: SpanStatusCode.OK });
  return result;
} catch (error) {
  aiOperationSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
  throw error;
} finally {
  aiOperationSpan.end();
}
```

## 總結

透過整合 Cloudflare Workers AI，我們的馬拉松系統現在具備了：

1. **智能內容生成**：使用 Stable Diffusion 模型生成個人化海報和證書
2. **智能客服**：基於函數調用的 AI 助手，能夠查詢和更新跑者資料
3. **數據分析**：AI 驅動的報名數據分析和預測
4. **多語言支援**：自動翻譯通知和內容
5. **圖像分析**：訓練照片分析和建議
