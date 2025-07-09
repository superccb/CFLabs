/**
 * 雲筆記本主入口
 * 基於 Cloudflare Workers + KV 的無服務器筆記應用
 */

const SALT = 'your-salt-here'; // 需要從環境變量設置
const SECRET = 'your-secret-here'; // 需要從環境變量設置

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    try {
      // 處理 CORS
      if (request.method === 'OPTIONS') {
        return handleCORS();
      }
      
      // API 路由
      if (pathname.startsWith('/api/')) {
        return await handleAPI(request, env, pathname);
      }
      
      // 根路徑 - 生成新筆記
      if (pathname === '/') {
        const noteId = generateNoteId();
        return Response.redirect(`/${noteId}`, 302);
      }
      
      // 筆記路徑
      const noteId = pathname.slice(1);
      if (noteId && /^[a-zA-Z0-9_-]+$/.test(noteId)) {
        return await serveNote(noteId, env);
      }
      
      return new Response('Not Found', { status: 404 });
      
    } catch (error) {
      console.error('Error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};

/**
 * 處理 API 請求
 */
async function handleAPI(request, env, pathname) {
  const noteId = pathname.split('/')[2];
  
  if (!noteId) {
    return new Response('Invalid note ID', { status: 400 });
  }
  
  switch (request.method) {
    case 'GET':
      return await getNoteContent(noteId, env);
    case 'POST':
      return await saveNoteContent(noteId, request, env);
    default:
      return new Response('Method not allowed', { status: 405 });
  }
}

/**
 * 獲取筆記內容
 */
async function getNoteContent(noteId, env) {
  try {
    const key = hashNoteId(noteId);
    const content = await env.NOTES.get(key);
    
    return new Response(JSON.stringify({
      content: content || '',
      noteId: noteId
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error getting note:', error);
    return new Response('Error getting note', { status: 500 });
  }
}

/**
 * 保存筆記內容
 */
async function saveNoteContent(noteId, request, env) {
  try {
    const { content } = await request.json();
    const key = hashNoteId(noteId);
    
    await env.NOTES.put(key, content);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Note saved successfully',
      noteId: noteId
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error saving note:', error);
    return new Response('Error saving note', { status: 500 });
  }
}

/**
 * 服務筆記頁面
 */
async function serveNote(noteId, env) {
  const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>雲筆記本 - ${noteId}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
            border: 1px solid rgba(255, 255, 255, 0.18);
            min-height: 80vh;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
        }
        
        .title {
            font-size: 2em;
            color: #2c3e50;
            margin: 0;
        }
        
        .note-id {
            font-size: 1em;
            color: #7f8c8d;
            background: #ecf0f1;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
        }
        
        .editor {
            flex: 1;
            border: none;
            outline: none;
            font-size: 16px;
            line-height: 1.6;
            resize: none;
            font-family: 'Consolas', 'Monaco', monospace;
            background: transparent;
            color: #2c3e50;
            padding: 20px;
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.5);
        }
        
        .status {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 2px solid #f0f0f0;
            font-size: 0.9em;
            color: #7f8c8d;
        }
        
        .save-status {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .indicator {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #27ae60;
        }
        
        .indicator.saving {
            background: #f39c12;
        }
        
        .indicator.error {
            background: #e74c3c;
        }
        
        .actions {
            display: flex;
            gap: 10px;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        
        .btn-primary {
            background: #3498db;
            color: white;
        }
        
        .btn-primary:hover {
            background: #2980b9;
        }
        
        .btn-secondary {
            background: #95a5a6;
            color: white;
        }
        
        .btn-secondary:hover {
            background: #7f8c8d;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 20px;
                margin: 10px;
            }
            
            .header {
                flex-direction: column;
                gap: 10px;
            }
            
            .title {
                font-size: 1.5em;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">📝 雲筆記本</h1>
            <div class="note-id">筆記: ${noteId}</div>
        </div>
        
        <textarea 
            class="editor" 
            id="editor" 
            placeholder="開始寫作吧... 內容會自動保存"
            spellcheck="false"
        ></textarea>
        
        <div class="status">
            <div class="save-status">
                <div class="indicator" id="indicator"></div>
                <span id="status-text">已保存</span>
            </div>
            <div class="actions">
                <button class="btn btn-secondary" onclick="clearNote()">清空</button>
                <button class="btn btn-primary" onclick="newNote()">新建筆記</button>
            </div>
        </div>
    </div>
    
    <script>
        const noteId = '${noteId}';
        const editor = document.getElementById('editor');
        const indicator = document.getElementById('indicator');
        const statusText = document.getElementById('status-text');
        let saveTimeout;
        let lastContent = '';
        
        // 載入筆記內容
        async function loadNote() {
            try {
                const response = await fetch(\`/api/\${noteId}\`);
                const data = await response.json();
                editor.value = data.content;
                lastContent = data.content;
            } catch (error) {
                console.error('Error loading note:', error);
                setStatus('載入失敗', 'error');
            }
        }
        
        // 保存筆記
        async function saveNote() {
            if (editor.value === lastContent) return;
            
            setStatus('保存中...', 'saving');
            
            try {
                const response = await fetch(\`/api/\${noteId}\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        content: editor.value
                    })
                });
                
                if (response.ok) {
                    lastContent = editor.value;
                    setStatus('已保存', 'saved');
                } else {
                    setStatus('保存失敗', 'error');
                }
            } catch (error) {
                console.error('Error saving note:', error);
                setStatus('保存失敗', 'error');
            }
        }
        
        // 設置狀態
        function setStatus(text, type) {
            statusText.textContent = text;
            indicator.className = 'indicator';
            if (type === 'saving') indicator.classList.add('saving');
            if (type === 'error') indicator.classList.add('error');
        }
        
        // 自動保存
        editor.addEventListener('input', () => {
            clearTimeout(saveTimeout);
            setStatus('編輯中...', 'saving');
            
            saveTimeout = setTimeout(() => {
                saveNote();
            }, 1000);
        });
        
        // 清空筆記
        function clearNote() {
            if (confirm('確定要清空筆記嗎？')) {
                editor.value = '';
                saveNote();
            }
        }
        
        // 新建筆記
        function newNote() {
            window.location.href = '/';
        }
        
        // 初始化
        loadNote();
    </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
    },
  });
}

/**
 * 生成隨機筆記ID
 */
function generateNoteId() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 對筆記ID進行哈希處理
 */
function hashNoteId(noteId) {
  // 簡單的哈希處理，實際部署時建議使用更安全的方法
  return 'note_' + noteId;
}

/**
 * 處理 CORS
 */
function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
} 