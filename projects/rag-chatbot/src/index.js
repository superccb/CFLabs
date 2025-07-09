/**
 * RAG聊天機器人 - 基於Cloudflare Vectorize的知識庫AI助手
 * 
 * 功能：
 * - 文章摘要生成
 * - 向量化存儲
 * - RAG聊天對話
 * - 文章上傳管理
 * - 點擊統計
 */

// 工具函數：SHA-256哈希
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

// 工具函數：MD5哈希
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
    const db = env.BLOG_SUMMARY;
    const url = new URL(request.url);
    const query = decodeURIComponent(url.searchParams.get('id'));
    
    const commonHeader = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': "*",
      'Access-Control-Allow-Headers': "*",
      'Access-Control-Max-Age': '86400',
    };

    // RAG聊天對話端點
    if (url.pathname.startsWith("/ai_chat")) {
      if (!(request.headers.get('content-type') || '').includes('application/x-www-form-urlencoded')) {
        return Response.redirect("https://example.com", 302);
      }
      
      const req = await request.formData();
      let question = req.get("info");
      
      // 翻譯問題為英文
      const response = await env.AI.run(
        "@cf/meta/m2m100-1.2b",
        {
          text: question,
          source_lang: "chinese",
          target_lang: "english",
        }
      );
      
      // 生成問題的向量嵌入
      const { data } = await env.AI.run(
        "@cf/baai/bge-base-en-v1.5",
        {
          text: response.translated_text,
        }
      );
      
      let embeddings = data[0];
      let notes = [];
      let refer = [];
      
      // 查詢相似向量
      let { matches } = await env.MAYX_INDEX.query(embeddings, { topK: 5 });
      
      for (let i = 0; i < matches.length; i++) {
        if (matches[i].score > 0.6) {
          notes.push(await db.prepare(
            "SELECT summary FROM blog_summary WHERE id = ?1"
          ).bind(matches[i].id).first("summary"));
          refer.push(matches[i].id);
        }
      }
      
      // 構建上下文消息
      const contextMessage = notes.length
        ? `相關文章摘要：\n${notes.map(note => `- ${note}`).join("\n")}`
        : "";
      
      const messages = [
        ...(notes.length ? [{ role: 'system', content: contextMessage }] : []),
        { 
          role: "system", 
          content: `你是一個AI助理，現在的時間是：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}，如果對話中的內容與上述摘要相關，則引用參考回答，否則忽略。` 
        },
        { role: "user", content: question }
      ];

      const answer = await env.AI.run('@cf/qwen/qwen1.5-14b-chat-awq', {
        messages,
        stream: false,
      });

      return Response.json({
        "intent": {
          "appKey": "platform.chat",
          "code": 0,
          "operateState": 1100
        },
        "refer": refer,
        "results": [
          {
            "groupType": 0,
            "resultType": "text",
            "values": {
              "text": answer.response
            }
          }
        ]
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      });
    }

    // 參數驗證
    if (query == "null") {
      return new Response("id cannot be none", {
        headers: commonHeader
      });
    }

    // 生成文章摘要（流式）
    if (url.pathname.startsWith("/summary")) {
      let result = await db.prepare(
        "SELECT content FROM blog_summary WHERE id = ?1"
      ).bind(query).first("content");
      
      if (!result) {
        return new Response("No Record", {
          headers: commonHeader
        });
      }

      const messages = [
        {
          role: "system", 
          content: `你是一個專業的文章摘要助手。你的主要任務是對各種文章進行精煉和摘要，幫助用戶快速了解文章的核心內容。輸出內容必須以中文進行，不需要在回答中注明摘要，只需要輸出內容。`
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
          ...commonHeader
        }
      });
    }

    // 獲取文章摘要（非流式）
    else if (url.pathname.startsWith("/get_summary")) {
      const orig_sha = decodeURIComponent(url.searchParams.get('sign'));
      let result = await db.prepare(
        "SELECT content FROM blog_summary WHERE id = ?1"
      ).bind(query).first("content");
      
      if (!result) {
        return new Response("no", {
          headers: commonHeader
        });
      }
      
      let result_sha = await sha(result);
      if (result_sha != orig_sha) {
        return new Response("no", {
          headers: commonHeader
        });
      }
      
      let resp = await db.prepare(
        "SELECT summary FROM blog_summary WHERE id = ?1"
      ).bind(query).first("summary");
      
      if (!resp) {
        const messages = [
          {
            role: "system", 
            content: `你是一個專業的文章摘要助手。你的主要任務是對各種文章進行精煉和摘要，幫助用戶快速了解文章的核心內容。輸出內容必須以中文進行，不需要在回答中注明摘要，只需要輸出內容。`
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
      }
      
      // 檢查是否需要向量化
      let is_vec = await db.prepare(
        "SELECT `is_vec` FROM blog_summary WHERE id = ?1"
      ).bind(query).first("is_vec");
      
      if (is_vec == 0) {
        // 翻譯摘要為英文
        const response = await env.AI.run(
          "@cf/meta/m2m100-1.2b",
          {
            text: resp,
            source_lang: "chinese",
            target_lang: "english",
          }
        );
        
        // 生成向量嵌入
        const { data } = await env.AI.run(
          "@cf/baai/bge-base-en-v1.5",
          {
            text: response.translated_text,
          }
        );
        
        let embeddings = data[0];
        
        // 存儲到向量數據庫
        await env.MAYX_INDEX.upsert([{
          id: query,
          values: embeddings
        }]);
        
        await db.prepare("UPDATE blog_summary SET is_vec = 1 WHERE id = ?1")
          .bind(query).run();
      }
      
      return new Response(resp, {
        headers: commonHeader
      });
    }

    // 檢查文章是否已上傳
    else if (url.pathname.startsWith("/is_uploaded")) {
      const orig_sha = decodeURIComponent(url.searchParams.get('sign'));
      let result = await db.prepare(
        "SELECT content FROM blog_summary WHERE id = ?1"
      ).bind(query).first("content");
      
      if (!result) {
        return new Response("no", {
          headers: commonHeader
        });
      }
      
      let result_sha = await sha(result);
      if (result_sha != orig_sha) {
        return new Response("no", {
          headers: commonHeader
        });
      } else {
        return new Response("yes", {
          headers: commonHeader
        });
      }
    }

    // 上傳文章內容
    else if (url.pathname.startsWith("/upload_blog")) {
      if (request.method == "POST") {
        const data = await request.text();
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
          await db.prepare("UPDATE blog_summary SET content = ?1, summary = NULL, is_vec = 0 WHERE id = ?2")
            .bind(data, query).run();
        }
        
        return new Response("OK", {
          headers: commonHeader
        });
      } else {
        return new Response("need post", {
          headers: commonHeader
        });
      }
    }

    // 點擊統計
    else if (url.pathname.startsWith("/count_click")) {
      let id_md5 = await md5(query);
      let count = await db.prepare("SELECT `counter` FROM `counter` WHERE `url` = ?1")
        .bind(id_md5).first("counter");
      
      if (url.pathname.startsWith("/count_click_add")) {
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
      
      return new Response(count, {
        headers: commonHeader
      });
    }

    // 默認重定向
    else {
      return Response.redirect("https://example.com", 302);
    }
  }
}; 