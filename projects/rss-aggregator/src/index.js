/**
 * RSS 聚合器主入口
 * 基於 Cloudflare Workers 的 RSS 聚合服務
 */

import { handleAPI, handleCORS } from './handlers/api.js';
import { handleWeb } from './handlers/web.js';
import { runCrawler } from './handlers/crawler.js';

/**
 * 主要的 fetch 事件處理器
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    
    try {
      // 處理 CORS 預檢請求
      if (request.method === 'OPTIONS') {
        return handleCORS();
      }
      
      // API 路由
      if (pathname.startsWith('/api/')) {
        return await handleAPI(request, env);
      }
      
      // Web 界面路由
      if (pathname === '/' || pathname === '/index.html') {
        return await handleWeb(request, env);
      }
      
      // 健康檢查端點
      if (pathname === '/health') {
        return new Response(JSON.stringify({ 
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 404 未找到
      return new Response('Not Found', { status: 404 });
      
    } catch (error) {
      console.error('Unhandled error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  /**
   * 定時任務處理器 - 定期執行爬蟲
   */
  async scheduled(event, env, ctx) {
    console.log('Scheduled crawler started at:', new Date().toISOString());
    
    try {
      // 使用 ctx.waitUntil 確保任務在 Worker 終止前完成
      ctx.waitUntil(runCrawler(env));
      
      console.log('Scheduled crawler completed successfully');
    } catch (error) {
      console.error('Scheduled crawler failed:', error);
    }
  }
};

/**
 * 錯誤處理器
 * @param {Error} error - 錯誤對象
 * @returns {Response} 錯誤響應
 */
function handleError(error) {
  console.error('Error occurred:', error);
  
  return new Response(JSON.stringify({
    error: 'Internal Server Error',
    message: error.message || 'An unexpected error occurred'
  }), {
    status: 500,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * 輔助函數：記錄請求信息
 * @param {Request} request - 請求對象
 */
function logRequest(request) {
  const url = new URL(request.url);
  console.log(`${request.method} ${url.pathname} - ${request.headers.get('User-Agent') || 'Unknown'}`);
} 