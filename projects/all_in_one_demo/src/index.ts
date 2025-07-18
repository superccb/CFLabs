import { Hono } from 'hono';
import type { Context } from 'hono';
// @ts-ignore
import type { D1Database, R2Bucket, Queue } from '@cloudflare/workers-types';

// Cloudflare Workers 環境型別
interface Env {
  DB: D1Database;
  REGISTRATION_QUEUE: Queue;
  AI: any;
  IMAGES_BUCKET: R2Bucket;
}

type C = Context<{ Bindings: Env }>;

const app = new Hono<{ Bindings: Env }>();

// 馬拉松報名（加強錯誤捕獲）
app.post('/api/marathon-signup', async (c: C) => {
  try {
    const { firstName, lastName, email, address, distance } = await c.req.json();

    // 寫入 D1 資料庫
    const result = await c.env.DB.prepare(
      `INSERT INTO runners (firstName, lastName, email, address, distance) VALUES (?, ?, ?, ?, ?) RETURNING *`
    ).bind(firstName, lastName, email, address, distance).first();

    // 發送報名通知
    await c.env.REGISTRATION_QUEUE.send(JSON.stringify({
      firstName,
      email,
      type: 'registration_confirmation'
    }));

    // 異步生成歡迎海報
    c.executionCtx.waitUntil(
      (async () => {
        try {
          const prompt = `Create a professional marathon finish poster with: Runner name: ${firstName} ${lastName}, Distance: ${distance}, Beautiful marathon scenery background, Celebratory and professional design, High quality, photo-realistic style`;
          const response = await c.env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
            prompt,
            num_steps: 20,
            guidance: 7.5,
            width: 1024,
            height: 768
          });
          const imageBuffer = response as ArrayBuffer;
          const imageKey = `posters/${result.id}-${Date.now()}.png`;
          await c.env.IMAGES_BUCKET.put(imageKey, imageBuffer, {
            httpMetadata: { contentType: 'image/png' },
          });
        } catch (e) {
          // 忽略異步錯誤
        }
      })()
    );

    return c.json({
      message: '報名成功！',
      runnerId: result.id
    });
  } catch (error) {
    return c.json({ error: error?.stack || JSON.stringify(error) }, 500);
  }
});

// AI 智能助手查詢
app.post('/api/ai-assistant', async (c: C) => {
  const { message, userEmail } = await c.req.json();

  // 定義可調用的函數工具
  const tools = [
    {
      name: "get_registration_info",
      description: "獲取跑者的報名信息",
      parameters: {
        type: "object",
        properties: {
          email: { type: "string", description: "跑者的電子郵件地址" }
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
          distance: { type: "string", description: "馬拉松距離（如：full, half, 10K）" }
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

  // 系統提示
  const systemPrompt = `你是一個專業的馬拉松賽事助手。你可以：\n1. 查詢和更新跑者報名信息\n2. 提供比賽時間表和相關信息\n3. 發送通知給跑者\n4. 回答關於馬拉松的一般問題\n請用友好、專業的語調回答問題。如果需要執行特定操作，請使用提供的函數。`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: message }
  ];

  // 執行函數調用
  async function executeFunction(functionName: string, args: any): Promise<any> {
    switch (functionName) {
      case 'get_registration_info': {
        const result = await c.env.DB.prepare(
          'SELECT * FROM runners WHERE email = ?'
        ).bind(args.email).first();
        return result || { error: '找不到該跑者的報名信息' };
      }
      case 'update_runner_info': {
        const allowedFields = ['firstName', 'lastName', 'address', 'distance'];
        if (!allowedFields.includes(args.field)) {
          return { error: '不允許更新該字段' };
        }
        const result = await c.env.DB.prepare(
          `UPDATE runners SET ${args.field} = ? WHERE email = ?`
        ).bind(args.value, args.email).run();
        return result.success ? { success: true } : { error: '更新失敗' };
      }
      case 'get_race_schedule': {
        const schedules: Record<string, any> = {
          'full': {
            distance: '42.195K', startTime: '07:00', cutoffTime: '6小時', startingArea: 'A區'
          },
          'half': {
            distance: '21.0975K', startTime: '07:30', cutoffTime: '3小時', startingArea: 'B區'
          },
          '10K': {
            distance: '10K', startTime: '08:00', cutoffTime: '1.5小時', startingArea: 'C區'
          }
        };
        return args.distance ? schedules[args.distance] || { error: '未找到該距離的賽程' } : schedules;
      }
      case 'send_notification': {
        await c.env.REGISTRATION_QUEUE.send(JSON.stringify({
          email: args.email,
          message: args.message,
          type: 'custom_notification'
        }));
        return { success: true, message: '通知已發送' };
      }
      default:
        return { error: '未知函數' };
    }
  }

  try {
    // 使用支持函數調用的模型
    const response = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages,
      tools,
      max_tokens: 1000
    });
    const choice = response.choices[0];
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);
      // 執行函數調用
      const functionResult = await executeFunction(functionName, functionArgs);
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
      const finalResponse = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: followUpMessages,
        max_tokens: 1000
      });
      return c.json({ response: finalResponse.choices[0].message.content });
    }
    return c.json({ response: choice.message.content });
  } catch (error) {
    return c.json({ response: '抱歉，我暫時無法處理您的請求。請稍後再試。' });
  }
});

// 生成個人化完賽海報
app.post('/api/generate-poster', async (c: C) => {
  const { runnerId, finishTime, position } = await c.req.json();

  // 查詢跑者資料
  const runnerData = await c.env.DB.prepare(
    'SELECT * FROM runners WHERE id = ?'
  ).bind(runnerId).first();

  if (!runnerData) {
    return c.json({ error: '找不到跑者資料' }, 404);
  }

  // 生成海報
  const prompt = `Create a professional marathon finish poster with: Runner name: ${runnerData.firstName} ${runnerData.lastName}, Finish time: ${finishTime}, Distance: ${runnerData.distance}, Position: ${position}, Beautiful marathon scenery background, Celebratory and professional design, High quality, photo-realistic style`;
  const response = await c.env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
    prompt,
    num_steps: 20,
    guidance: 7.5,
    width: 1024,
    height: 768
  });
  const imageBuffer = response as ArrayBuffer;
  const imageKey = `posters/${runnerData.id}-${Date.now()}.png`;
  await c.env.IMAGES_BUCKET.put(imageKey, imageBuffer, {
    httpMetadata: { contentType: 'image/png' },
  });

  // 返回圖像 URL
  const posterUrl = `https://images.marathon.workers.dev/${imageKey}`;
  return c.json({ posterUrl });
});

// 生成賽事宣傳海報
app.post('/api/generate-event-poster', async (c: C) => {
  const eventDetails = await c.req.json();

  const prompt = `Create a vibrant marathon event poster with: Event name: ${eventDetails.name}, Date: ${eventDetails.date}, Location: ${eventDetails.location}, Registration info, Modern, energetic design, Running theme with city skyline, Bright colors and motivational feel`;
  const response = await c.env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
    prompt,
    num_steps: 25,
    guidance: 8.0,
    width: 1024,
    height: 1024
  });
  const imageBuffer = response as ArrayBuffer;
  const imageKey = `events/${eventDetails.id}-poster.png`;
  await c.env.IMAGES_BUCKET.put(imageKey, imageBuffer, {
    httpMetadata: { contentType: 'image/png' },
  });

  const posterUrl = `https://images.marathon.workers.dev/${imageKey}`;
  return c.json({ posterUrl });
});

// 報名數據分析
app.get('/api/ai-analytics', async (c: C) => {
  // 查詢所有跑者分組數據
  const runners = await c.env.DB.prepare(
    'SELECT distance, COUNT(*) as count FROM runners GROUP BY distance'
  ).all();

  const analysisPrompt = `分析以下馬拉松報名數據：${JSON.stringify(runners.results)}\n請提供：\n1. 參賽人數分佈分析\n2. 各距離項目的受歡迎程度\n3. 對賽事組織的建議\n4. 預測完賽率`;

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

// 訓練照片分析
app.post('/api/analyze-training-photo', async (c: C) => {
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
  const advicePrompt = `根據以下圖像分析結果，為馬拉松跑者提供訓練建議：${JSON.stringify(analysis)}`;
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

// 多語言通知發送
app.post('/api/send-multilingual-notification', async (c: C) => {
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

// 所有功能已全部完成，請檢查每個 API 路由是否符合你的需求，如需優化請隨時告知！
export default app; 