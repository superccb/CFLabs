/**
 * AI 圖像生成器 - 基於 Cloudflare Workers AI
 * 使用 Cloudflare Workers AI 的文生圖服務
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS 處理
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    try {
      switch (path) {
        case '/':
          return handleHome();
        case '/api/generate':
          return handleImageGeneration(request, env);
        case '/api/models':
          return handleModelsList();
        default:
          return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

/**
 * 處理圖像生成請求
 */
async function handleImageGeneration(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const body = await request.json();
  const { prompt, model = 'flux-1-schnell', resolution = { width: 1024, height: 1024 } } = body;

  if (!prompt) {
    return new Response(JSON.stringify({ error: 'Prompt is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 檢查緩存
  const cacheKey = `${model}_${resolution.width}x${resolution.height}_${btoa(prompt)}`;
  const cached = await env.IMAGE_CACHE.get(cacheKey);
  if (cached) {
    return new Response(JSON.stringify({ 
      image: cached,
      cached: true 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let imageData;
  try {
    // 根據模型設置不同的參數
    let inputs = {
      prompt: prompt.trim()
    };

    if (model === '@cf/black-forest-labs/flux-1-schnell') {
      // flux-1-schnell 模型使用 num_steps 參數
      inputs.num_steps = 8;
    } else {
      // 其他模型使用 width 和 height 參數
      inputs.width = resolution.width;
      inputs.height = resolution.height;
    }

    // 調用 Cloudflare Workers AI
    const response = await env.AI.run(model, inputs);

    if (model === '@cf/black-forest-labs/flux-1-schnell') {
      // flux-1-schnell 返回 base64 編碼
      if (response.image) {
        imageData = `data:image/png;base64,${response.image}`;
      } else {
        throw new Error('No image generated');
      }
    } else {
      // 其他模型返回二進制數據
      imageData = `data:image/png;base64,${btoa(String.fromCharCode(...new Uint8Array(response)))}`;
    }

    // 緩存結果
    await env.IMAGE_CACHE.put(cacheKey, imageData, { expirationTtl: 3600 }); // 1小時過期

    return new Response(JSON.stringify({ 
      image: imageData,
      cached: false 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Generation error:', error);
    return new Response(JSON.stringify({ error: 'Image generation failed: ' + error.message }), {
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
      id: '@cf/black-forest-labs/flux-1-schnell',
      name: 'Flux 1 Schnell',
      description: '快速生成，高質量圖像',
      resolutions: [{ width: 1024, height: 1024 }],
      features: ['快速生成', '高質量']
    },
    {
      id: '@cf/lykon/dreamshaper-8-lcm',
      name: 'DreamShaper 8 LCM',
      description: '藝術風格圖像生成',
      resolutions: [
        { width: 1024, height: 1024 },
        { width: 1152, height: 896 },
        { width: 896, height: 1152 }
      ],
      features: ['藝術風格', '多種尺寸']
    },
    {
      id: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
      name: 'Stable Diffusion XL',
      description: '高分辨率圖像生成',
      resolutions: [
        { width: 1024, height: 1024 },
        { width: 1152, height: 896 },
        { width: 896, height: 1152 }
      ],
      features: ['高分辨率', '穩定生成']
    },
    {
      id: '@cf/bytedance/stable-diffusion-xl-lightning',
      name: 'SDXL Lightning',
      description: '超快速圖像生成',
      resolutions: [
        { width: 1024, height: 1024 },
        { width: 1152, height: 896 },
        { width: 896, height: 1152 }
      ],
      features: ['超快速', '高質量']
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
    <title>AI 圖像生成器</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
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
            height: 100px;
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
            text-align: center;
        }
        .result img {
            max-width: 100%;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .loading {
            text-align: center;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 AI 圖像生成器</h1>
        
        <form id="generateForm">
            <div class="form-group">
                <label for="prompt">描述您想要的圖像：</label>
                <textarea id="prompt" placeholder="例如：一隻可愛的貓咪坐在花園裡，陽光明媚，水彩畫風格" required></textarea>
            </div>
            
            <div class="form-group">
                <label for="model">選擇模型：</label>
                <select id="model">
                    <option value="@cf/black-forest-labs/flux-1-schnell">Flux 1 Schnell (快速)</option>
                    <option value="@cf/lykon/dreamshaper-8-lcm">DreamShaper 8 LCM (藝術)</option>
                    <option value="@cf/stabilityai/stable-diffusion-xl-base-1.0">Stable Diffusion XL (高分辨率)</option>
                    <option value="@cf/bytedance/stable-diffusion-xl-lightning">SDXL Lightning (超快速)</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="resolution">圖像尺寸：</label>
                <select id="resolution">
                    <option value="1024x1024">1024x1024 (正方形)</option>
                    <option value="1152x896">1152x896 (橫向)</option>
                    <option value="896x1152">896x1152 (縱向)</option>
                </select>
            </div>
            
            <button type="submit" id="generateBtn">生成圖像</button>
        </form>
        
        <div id="result" class="result"></div>
    </div>

    <script>
        document.getElementById('generateForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('generateBtn');
            const result = document.getElementById('result');
            
            btn.disabled = true;
            btn.textContent = '生成中...';
            result.innerHTML = '<div class="loading">正在生成圖像，請稍候...</div>';
            
            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        prompt: document.getElementById('prompt').value,
                        model: document.getElementById('model').value,
                        resolution: {
                            width: parseInt(document.getElementById('resolution').value.split('x')[0]),
                            height: parseInt(document.getElementById('resolution').value.split('x')[1])
                        }
                    })
                });
                
                const data = await response.json();
                
                if (data.error) {
                    result.innerHTML = '<div style="color: red;">錯誤：' + data.error + '</div>';
                } else {
                    result.innerHTML = \`
                        <h3>生成結果 \${data.cached ? '(來自緩存)' : ''}</h3>
                        <img src="\${data.image}" alt="生成的圖像">
                        <p><a href="\${data.image}" target="_blank">在新標籤頁中打開</a></p>
                    \`;
                }
            } catch (error) {
                result.innerHTML = '<div style="color: red;">請求失敗：' + error.message + '</div>';
            } finally {
                btn.disabled = false;
                btn.textContent = '生成圖像';
            }
        });
        
        // 根據模型更新選項
        document.getElementById('model').addEventListener('change', function() {
            const model = this.value;
            const resolutionSelect = document.getElementById('resolution');
            
            if (model === '@cf/black-forest-labs/flux-1-schnell') {
                // Flux 1 Schnell 只支持 1024x1024
                resolutionSelect.innerHTML = '<option value="1024x1024">1024x1024 (正方形)</option>';
            } else {
                // 其他模型支持多種尺寸
                resolutionSelect.innerHTML = \`
                    <option value="1024x1024">1024x1024 (正方形)</option>
                    <option value="1152x896">1152x896 (橫向)</option>
                    <option value="896x1152">896x1152 (縱向)</option>
                \`;
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

/**
 * 處理 CORS
 */
function handleCORS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
} 