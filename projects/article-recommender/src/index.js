/**
 * 相似文章推薦系統 - 基於Cloudflare Vectorize的智能推薦
 * 
 * 功能：
 * - 基於向量相似度的文章推薦
 * - 推薦結果緩存機制
 * - 前端搜索JSON緩存
 * - 智能推薦算法
 */

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

    // 相似文章推薦端點
    if (url.pathname.startsWith("/suggest")) {
      let resp = [];
      let update_time = url.searchParams.get('update');
      
      if (update_time) {
        // 根據ID獲取文章向量
        let result = await env.MAYX_INDEX.getByIds([query]);
        
        if (result.length) {
          // 檢查緩存
          let cache = await db.prepare("SELECT `id`, `suggest`, `suggest_update` FROM `blog_summary` WHERE `id` = ?1")
            .bind(query).first();
          
          if (!cache.id) {
            return Response.json(resp, {
              headers: commonHeader
            });
          }
          
          // 如果緩存過期，重新計算推薦
          if (update_time != cache.suggest_update) {
            // 查詢相似向量
            resp = await env.MAYX_INDEX.query(result[0].values, { topK: 6 });
            resp = resp.matches;
            
            // 移除自己（第一條）
            resp.splice(0, 1);
            
            // 更新緩存
            await db.prepare("UPDATE `blog_summary` SET `suggest_update` = ?1, `suggest` = ?2 WHERE `id` = ?3")
              .bind(update_time, JSON.stringify(resp), query).run();
          } else {
            // 使用緩存結果
            resp = JSON.parse(cache.suggest);
          }
        }
        
        // 編碼ID
        resp = resp.map(respObj => {
          respObj.id = encodeURI(respObj.id);
          return respObj;
        });
      }
      
      return Response.json(resp, {
        headers: commonHeader
      });
    }

    // 搜索JSON端點（用於前端緩存）
    if (url.pathname.startsWith("/search.json")) {
      // 獲取所有文章信息
      let articles = await db.prepare("SELECT `id`, `title`, `url`, `date` FROM `blog_summary` ORDER BY `date` DESC").all();
      
      return Response.json(articles.results, {
        headers: {
          'Content-Type': 'application/json',
          ...commonHeader
        }
      });
    }

    // 文章信息端點
    if (url.pathname.startsWith("/article_info")) {
      if (!query) {
        return Response.json({ error: "Missing article ID" }, {
          headers: commonHeader
        });
      }
      
      let article = await db.prepare("SELECT `id`, `title`, `url`, `date`, `summary` FROM `blog_summary` WHERE `id` = ?1")
        .bind(query).first();
      
      if (!article) {
        return Response.json({ error: "Article not found" }, {
          headers: commonHeader
        });
      }
      
      return Response.json(article, {
        headers: commonHeader
      });
    }

    // 批量文章信息端點
    if (url.pathname.startsWith("/articles_batch")) {
      const ids = url.searchParams.get('ids');
      
      if (!ids) {
        return Response.json({ error: "Missing article IDs" }, {
          headers: commonHeader
        });
      }
      
      const idArray = ids.split(',');
      let articles = [];
      
      for (let id of idArray) {
        let article = await db.prepare("SELECT `id`, `title`, `url`, `date` FROM `blog_summary` WHERE `id` = ?1")
          .bind(decodeURIComponent(id)).first();
        
        if (article) {
          articles.push(article);
        }
      }
      
      return Response.json(articles, {
        headers: commonHeader
      });
    }

    // 推薦統計端點
    if (url.pathname.startsWith("/recommendation_stats")) {
      let stats = await db.prepare(`
        SELECT 
          COUNT(*) as total_articles,
          COUNT(CASE WHEN suggest IS NOT NULL THEN 1 END) as articles_with_suggestions,
          COUNT(CASE WHEN is_vec = 1 THEN 1 END) as vectorized_articles
        FROM blog_summary
      `).first();
      
      return Response.json(stats, {
        headers: commonHeader
      });
    }

    // 清除推薦緩存端點
    if (url.pathname.startsWith("/clear_suggest_cache")) {
      if (request.method === "POST") {
        await db.prepare("UPDATE `blog_summary` SET `suggest` = NULL, `suggest_update` = NULL").run();
        
        return Response.json({ message: "Cache cleared successfully" }, {
          headers: commonHeader
        });
      } else {
        return new Response("Method not allowed", {
          status: 405,
          headers: commonHeader
        });
      }
    }

    // 默認重定向
    return Response.redirect("https://example.com", 302);
  }
}; 