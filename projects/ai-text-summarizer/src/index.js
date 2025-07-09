/**
 * AI 文字摘要器 - 基於 Cloudflare Workers AI
 * 使用 Cloudflare Workers AI 的智能文本摘要服務
 */

// 通用 CORS 頭部
const commonHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

// SHA-256 哈希函數
async function sha(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

// MD5 哈希函數
async function md5(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const query = decodeURIComponent(url.searchParams.get('id') || '');
    const sign = decodeURIComponent(url.searchParams.get('sign') || '');

    // CORS 處理
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: commonHeaders });
    }

    try {
      // 新的 API 端點（基於參考代碼）
      if (path.startsWith('/summary')) {
        return handleStreamSummary(query, env);
      } else if (path.startsWith('/get_summary')) {
        return handleGetSummary(query, sign, env);
      } else if (path.startsWith('/is_uploaded')) {
        return handleIsUploaded(query, sign, env);
      } else if (path.startsWith('/upload_blog')) {
        return handleUploadBlog(request, query, env);
      } else if (path.startsWith('/count_click')) {
        return handleCountClick(query, path, env);
      } else if (path.startsWith('/count_click_add')) {
        return handleCountClick(query, path, env);
      }
      
      // 原有的 API 端點
      switch (path) {
        case '/':
          return handleHome();
        case '/api/summarize':
          return handleTextSummarization(request, env);
        case '/api/models':
          return handleModelsList();
        case '/api/extract':
          return handleTextExtraction(request, env);
        default:
          return Response.redirect("https://mabbs.github.io", 302);
      }
    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { ...commonHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

/**
 * 處理文本摘要請求
 */
async function handleTextSummarization(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const body = await request.json();
  const { 
    text, 
    model = '@cf/meta/llama-2-7b-chat-int8', 
    maxLength = 200, 
    style = 'concise',
    language = 'zh-CN'
  } = body;

  if (!text) {
    return new Response(JSON.stringify({ error: 'Text is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 檢查文本長度
  if (text.length > 10000) {
    return new Response(JSON.stringify({ error: 'Text too long (max 10000 characters)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 檢查緩存
  const cacheKey = `${model}_${maxLength}_${style}_${language}_${btoa(text.substring(0, 100))}`;
  const cached = await env.SUMMARY_CACHE.get(cacheKey);
  if (cached) {
    return new Response(JSON.stringify({ 
      summary: cached,
      cached: true 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let summary;
  try {
    // 使用 Cloudflare Workers AI 進行文本摘要
    summary = await summarizeWithWorkersAI(text, maxLength, style, language, model, env);

    // 緩存結果
    await env.SUMMARY_CACHE.put(cacheKey, summary, { expirationTtl: 7200 }); // 2小時過期

    return new Response(JSON.stringify({ 
      summary,
      cached: false 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Summarization error:', error);
    return new Response(JSON.stringify({ error: 'Text summarization failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 使用 Cloudflare Workers AI 進行文本摘要
 */
async function summarizeWithWorkersAI(text, maxLength, style, language, model, env) {
  const stylePrompts = {
    concise: '簡潔明瞭',
    detailed: '詳細完整',
    bullet: '要點列表',
    academic: '學術風格',
    casual: '輕鬆口語'
  };

  const prompt = `請將以下文本進行摘要，要求：
1. 摘要長度控制在 ${maxLength} 字以內
2. 風格：${stylePrompts[style]}
3. 語言：${language}
4. 保留重要信息和關鍵點
5. 確保摘要的準確性和完整性

原文：
${text}

摘要：`;

  try {
    const response = await env.AI.run(model, {
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: Math.min(maxLength * 2, 1000),
      temperature: 0.3
    });

    return response.response.trim();
  } catch (error) {
    console.error('Workers AI error:', error);
    throw new Error(`AI processing failed: ${error.message}`);
  }
}

/**
 * 處理流式摘要生成
 */
async function handleStreamSummary(query, env) {
  if (!query || query === "null") {
    return new Response("id cannot be none", { headers: commonHeaders });
  }

  const db = env.BLOG_SUMMARY;
  let result = await db.prepare(
    "SELECT content FROM blog_summary WHERE id = ?1"
  ).bind(query).first("content");

  if (!result) {
    return new Response("No Record", { headers: commonHeaders });
  }

  const messages = [
    {
      role: "system", 
      content: `你是一个专业的文章摘要助手。你的主要任务是对各种文章进行精炼和摘要，帮助用户快速了解文章的核心内容。你读完整篇文章后，能够提炼出文章的关键信息，以及作者的主要观点和结论。
技能
  精炼摘要：能够快速阅读并理解文章内容，提取出文章的主要关键点，用简洁明了的中文进行阐述。
  关键信息提取：识别文章中的重要信息，如主要观点、数据支持、结论等，并有效地进行总结。
  客观中立：在摘要过程中保持客观中立的态度，避免引入个人偏见。
约束
  输出内容必须以中文进行。
  必须确保摘要内容准确反映原文章的主旨和重点。
  尊重原文的观点，不能进行歪曲或误导。
  在摘要中明确区分事实与作者的意见或分析。
提示
  不需要在回答中注明摘要（不需要使用冒号），只需要输出内容。
格式
  你的回答格式应该如下：
    这篇文章介绍了<这里是内容>`
    },
    { role: "user", content: result.substring(0, 5000) }
  ];

  const stream = await env.AI.run('@cf/qwen/qwen1.5-14b-chat-awq', {
    messages,
    stream: true,
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      ...commonHeaders
    }
  });
}

/**
 * 處理獲取摘要請求
 */
async function handleGetSummary(query, sign, env) {
  if (!query || query === "null") {
    return new Response("id cannot be none", { headers: commonHeaders });
  }

  const db = env.BLOG_SUMMARY;
  let result = await db.prepare(
    "SELECT content FROM blog_summary WHERE id = ?1"
  ).bind(query).first("content");

  if (!result) {
    return new Response("no", { headers: commonHeaders });
  }

  let result_sha = await sha(result);
  if (result_sha != sign) {
    return new Response("no", { headers: commonHeaders });
  }

  let resp = await db.prepare(
    "SELECT summary FROM blog_summary WHERE id = ?1"
  ).bind(query).first("summary");

  if (resp) {
    return new Response(resp, { headers: commonHeaders });
  } else {
    const messages = [
      {
        role: "system", 
        content: `你是一个专业的文章摘要助手。你的主要任务是对各种文章进行精炼和摘要，帮助用户快速了解文章的核心内容。你读完整篇文章后，能够提炼出文章的关键信息，以及作者的主要观点和结论。
技能
  精炼摘要：能够快速阅读并理解文章内容，提取出文章的主要关键点，用简洁明了的中文进行阐述。
  关键信息提取：识别文章中的重要信息，如主要观点、数据支持、结论等，并有效地进行总结。
  客观中立：在摘要过程中保持客观中立的态度，避免引入个人偏见。
约束
  输出内容必须以中文进行。
  必须确保摘要内容准确反映原文章的主旨和重点。
  尊重原文的观点，不能进行歪曲或误导。
  在摘要中明确区分事实与作者的意见或分析。
提示
  不需要在回答中注明摘要（不需要使用冒号），只需要输出内容。
格式
  你的回答格式应该如下：
    这篇文章介绍了<这里是内容>`
      },
      { role: "user", content: result.substring(0, 5000) }
    ];

    const answer = await env.AI.run('@cf/qwen/qwen1.5-14b-chat-awq', {
      messages,
      stream: false,
    });
    
    resp = answer.response;
    await db.prepare("UPDATE blog_summary SET summary = ?1 WHERE id = ?2")
      .bind(resp, query).run();
    
    return new Response(resp, { headers: commonHeaders });
  }
}

/**
 * 處理檢查是否已上傳
 */
async function handleIsUploaded(query, sign, env) {
  if (!query || query === "null") {
    return new Response("id cannot be none", { headers: commonHeaders });
  }

  const db = env.BLOG_SUMMARY;
  let result = await db.prepare(
    "SELECT content FROM blog_summary WHERE id = ?1"
  ).bind(query).first("content");

  if (!result) {
    return new Response("no", { headers: commonHeaders });
  }

  let result_sha = await sha(result);
  if (result_sha != sign) {
    return new Response("no", { headers: commonHeaders });
  } else {
    return new Response("yes", { headers: commonHeaders });
  }
}

/**
 * 處理上傳博客內容
 */
async function handleUploadBlog(request, query, env) {
  if (request.method !== "POST") {
    return new Response("need post", { headers: commonHeaders });
  }

  if (!query || query === "null") {
    return new Response("id cannot be none", { headers: commonHeaders });
  }

  const data = await request.text();
  const db = env.BLOG_SUMMARY;
  
  let result = await db.prepare(
    "SELECT content FROM blog_summary WHERE id = ?1"
  ).bind(query).first("content");

  if (!result) {
    await db.prepare("INSERT INTO blog_summary(id, content) VALUES (?1, ?2)")
      .bind(query, data).run();
    result = await db.prepare(
      "SELECT content FROM blog_summary WHERE id = ?1"
    ).bind(query).first("content");
  }

  if (result != data) {
    await db.prepare("UPDATE blog_summary SET content = ?1, summary = NULL WHERE id = ?2")
      .bind(data, query).run();
  }

  return new Response("OK", { headers: commonHeaders });
}

/**
 * 處理點擊計數
 */
async function handleCountClick(query, path, env) {
  if (!query || query === "null") {
    return new Response("id cannot be none", { headers: commonHeaders });
  }

  const db = env.BLOG_SUMMARY;
  let id_md5 = await md5(query);
  let count = await db.prepare("SELECT `counter` FROM `counter` WHERE `url` = ?1")
    .bind(id_md5).first("counter");

  if (path.startsWith("/count_click_add")) {
    if (!count) {
      await db.prepare("INSERT INTO `counter` (`url`, `counter`) VALUES (?1, 1)")
        .bind(id_md5).run();
      count = 1;
    } else {
      count += 1;
      await db.prepare("UPDATE `counter` SET `counter` = ?1 WHERE `url` = ?2")
        .bind(count, id_md5).run();
    }
  }

  if (!count) {
    count = 0;
  }

  return new Response(count.toString(), { headers: commonHeaders });
}

/**
 * 處理文本提取請求（從 URL 提取文本）
 */
async function handleTextExtraction(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const body = await request.json();
  const { url } = body;

  if (!url) {
    return new Response(JSON.stringify({ error: 'URL is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    
    // 簡單的 HTML 文本提取（移除標籤）
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return new Response(JSON.stringify({ 
      text: text.substring(0, 5000), // 限制長度
      url 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Text extraction error:', error);
    return new Response(JSON.stringify({ error: 'Text extraction failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 獲取支持的模型列表
 */
function handleModelsList() {
  const models = [
    {
      id: '@cf/meta/llama-2-7b-chat-int8',
      name: 'Llama 2 7B Chat',
      description: '快速準確的文本摘要',
      maxLength: 500,
      styles: ['concise', 'detailed', 'bullet', 'academic', 'casual'],
      languages: ['zh-CN', 'en-US', 'ja-JP']
    },
    {
      id: '@cf/meta/llama-3.1-8b-instruct',
      name: 'Llama 3.1 8B Instruct',
      description: '高質量文本摘要，理解能力強',
      maxLength: 1000,
      styles: ['concise', 'detailed', 'bullet', 'academic', 'casual'],
      languages: ['zh-CN', 'en-US', 'ja-JP']
    },
    {
      id: '@cf/mistral/mistral-7b-instruct-v0.2',
      name: 'Mistral 7B Instruct',
      description: '平衡性能和質量的文本摘要',
      maxLength: 800,
      styles: ['concise', 'detailed', 'bullet', 'academic', 'casual'],
      languages: ['zh-CN', 'en-US', 'ja-JP']
    }
  ];

  return new Response(JSON.stringify({ models }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * 首頁
 */
function handleHome() {
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI 文字摘要器</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .tabs {
            display: flex;
            margin-bottom: 20px;
            border-bottom: 1px solid #ddd;
        }
        .tab {
            padding: 10px 20px;
            cursor: pointer;
            border: none;
            background: none;
            font-size: 16px;
        }
        .tab.active {
            border-bottom: 2px solid #007bff;
            color: #007bff;
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }
        input, select, textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
        }
        textarea {
            height: 200px;
            resize: vertical;
        }
        button {
            background: #007bff;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
        }
        button:hover {
            background: #0056b3;
        }
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        .result {
            margin-top: 20px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 5px;
            border-left: 4px solid #007bff;
        }
        .loading {
            text-align: center;
            color: #666;
        }
        .char-count {
            text-align: right;
            color: #666;
            font-size: 14px;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📝 AI 文字摘要器</h1>
        
        <div class="tabs">
            <button class="tab active" onclick="switchTab('text')">文本摘要</button>
            <button class="tab" onclick="switchTab('url')">網頁摘要</button>
        </div>
        
        <div id="text-tab" class="tab-content active">
            <form id="summarizeForm">
                <div class="form-group">
                    <label for="text">輸入要摘要的文本：</label>
                    <textarea id="text" placeholder="請輸入要摘要的文本內容..." required></textarea>
                    <div class="char-count" id="charCount">0 字符</div>
                </div>
                
                <div class="form-group">
                    <label for="model">選擇模型：</label>
                    <select id="model">
                        <option value="@cf/meta/llama-2-7b-chat-int8">Llama 2 7B Chat (快速)</option>
                        <option value="@cf/meta/llama-3.1-8b-instruct">Llama 3.1 8B Instruct (高質量)</option>
                        <option value="@cf/mistral/mistral-7b-instruct-v0.2">Mistral 7B Instruct (平衡)</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="maxLength">摘要長度：</label>
                    <select id="maxLength">
                        <option value="100">100 字</option>
                        <option value="200" selected>200 字</option>
                        <option value="300">300 字</option>
                        <option value="500">500 字</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="style">摘要風格：</label>
                    <select id="style">
                        <option value="concise" selected>簡潔明瞭</option>
                        <option value="detailed">詳細完整</option>
                        <option value="bullet">要點列表</option>
                        <option value="academic">學術風格</option>
                        <option value="casual">輕鬆口語</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="language">輸出語言：</label>
                    <select id="language">
                        <option value="zh-CN" selected>中文</option>
                        <option value="en-US">English</option>
                        <option value="ja-JP">日本語</option>
                    </select>
                </div>
                
                <button type="submit" id="summarizeBtn">生成摘要</button>
            </form>
        </div>
        
        <div id="url-tab" class="tab-content">
            <form id="urlForm">
                <div class="form-group">
                    <label for="url">輸入網頁 URL：</label>
                    <input type="url" id="url" placeholder="https://example.com/article" required>
                </div>
                
                <div class="form-group">
                    <label for="urlModel">選擇模型：</label>
                    <select id="urlModel">
                        <option value="@cf/meta/llama-2-7b-chat-int8">Llama 2 7B Chat (快速)</option>
                        <option value="@cf/meta/llama-3.1-8b-instruct">Llama 3.1 8B Instruct (高質量)</option>
                        <option value="@cf/mistral/mistral-7b-instruct-v0.2">Mistral 7B Instruct (平衡)</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="urlMaxLength">摘要長度：</label>
                    <select id="urlMaxLength">
                        <option value="200" selected>200 字</option>
                        <option value="300">300 字</option>
                        <option value="500">500 字</option>
                    </select>
                </div>
                
                <button type="submit" id="urlBtn">提取並摘要</button>
            </form>
        </div>
        
        <div id="result" class="result" style="display: none;"></div>
    </div>

    <script>
        // 字符計數
        document.getElementById('text').addEventListener('input', function() {
            const count = this.value.length;
            document.getElementById('charCount').textContent = count + ' 字符';
        });
        
        // 切換標籤
        function switchTab(tabName) {
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            event.target.classList.add('active');
            document.getElementById(tabName + '-tab').classList.add('active');
        }
        
        // 文本摘要
        document.getElementById('summarizeForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('summarizeBtn');
            const result = document.getElementById('result');
            
            btn.disabled = true;
            btn.textContent = '生成中...';
            result.style.display = 'block';
            result.innerHTML = '<div class="loading">正在生成摘要，請稍候...</div>';
            
            try {
                const response = await fetch('/api/summarize', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text: document.getElementById('text').value,
                        model: document.getElementById('model').value,
                        maxLength: parseInt(document.getElementById('maxLength').value),
                        style: document.getElementById('style').value,
                        language: document.getElementById('language').value
                    })
                });
                
                const data = await response.json();
                
                if (data.error) {
                    result.innerHTML = '<div style="color: red;">錯誤：' + data.error + '</div>';
                } else {
                    result.innerHTML = \`
                        <h3>摘要結果 \${data.cached ? '(來自緩存)' : ''}</h3>
                        <p>\${data.summary}</p>
                        <p><small>字符數：\${data.summary.length}</small></p>
                    \`;
                }
            } catch (error) {
                result.innerHTML = '<div style="color: red;">請求失敗：' + error.message + '</div>';
            } finally {
                btn.disabled = false;
                btn.textContent = '生成摘要';
            }
        });
        
        // URL 摘要
        document.getElementById('urlForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('urlBtn');
            const result = document.getElementById('result');
            
            btn.disabled = true;
            btn.textContent = '處理中...';
            result.style.display = 'block';
            result.innerHTML = '<div class="loading">正在提取網頁內容並生成摘要，請稍候...</div>';
            
            try {
                // 先提取文本
                const extractResponse = await fetch('/api/extract', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        url: document.getElementById('url').value
                    })
                });
                
                const extractData = await extractResponse.json();
                
                if (extractData.error) {
                    result.innerHTML = '<div style="color: red;">提取失敗：' + extractData.error + '</div>';
                    return;
                }
                
                // 再生成摘要
                const summaryResponse = await fetch('/api/summarize', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text: extractData.text,
                        model: document.getElementById('urlModel').value,
                        maxLength: parseInt(document.getElementById('urlMaxLength').value),
                        style: 'concise',
                        language: 'zh-CN'
                    })
                });
                
                const summaryData = await summaryResponse.json();
                
                if (summaryData.error) {
                    result.innerHTML = '<div style="color: red;">摘要失敗：' + summaryData.error + '</div>';
                } else {
                    result.innerHTML = \`
                        <h3>網頁摘要結果</h3>
                        <p><strong>來源：</strong><a href="\${extractData.url}" target="_blank">\${extractData.url}</a></p>
                        <p><strong>摘要：</strong></p>
                        <p>\${summaryData.summary}</p>
                        <p><small>字符數：\${summaryData.summary.length}</small></p>
                    \`;
                }
            } catch (error) {
                result.innerHTML = '<div style="color: red;">請求失敗：' + error.message + '</div>';
            } finally {
                btn.disabled = false;
                btn.textContent = '提取並摘要';
            }
        });
    </script>
</body>
</html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=utf-8' }
  });
}

 