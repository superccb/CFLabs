/**
 * API 處理器
 * 提供 REST API 接口來管理 RSS 源和獲取數據
 */

import { 
  getAggregatedFeeds, 
  triggerCrawler, 
  getCrawlerStatus 
} from './crawler.js';
import { 
  getAllRSSSources, 
  getRSSSource, 
  saveRSSSource, 
  deleteRSSSource, 
  generateSourceId,
  getCachedRSSData 
} from '../utils/storage.js';
import { isValidRSSUrl } from '../utils/rss-parser.js';

/**
 * 處理 API 請求
 * @param {Request} request - 請求對象
 * @param {Object} env - 環境變數
 * @returns {Promise<Response>} 響應對象
 */
export async function handleAPI(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  try {
    // 路由處理
    if (path === '/api/feeds' && method === 'GET') {
      return await handleGetFeeds(request, env);
    }
    
    if (path.startsWith('/api/feeds/') && method === 'GET') {
      const sourceId = path.split('/')[3];
      return await handleGetFeedBySource(sourceId, request, env);
    }
    
    if (path === '/api/sources' && method === 'GET') {
      return await handleGetSources(env);
    }
    
    if (path === '/api/sources' && method === 'POST') {
      return await handleCreateSource(request, env);
    }
    
    if (path.startsWith('/api/sources/') && method === 'GET') {
      const sourceId = path.split('/')[3];
      return await handleGetSource(sourceId, env);
    }
    
    if (path.startsWith('/api/sources/') && method === 'PUT') {
      const sourceId = path.split('/')[3];
      return await handleUpdateSource(sourceId, request, env);
    }
    
    if (path.startsWith('/api/sources/') && method === 'DELETE') {
      const sourceId = path.split('/')[3];
      return await handleDeleteSource(sourceId, env);
    }
    
    if (path === '/api/crawler/trigger' && method === 'POST') {
      return await handleTriggerCrawler(request, env);
    }
    
    if (path === '/api/crawler/status' && method === 'GET') {
      return await handleGetCrawlerStatus(env);
    }
    
    // 404 - 未找到路由
    return createJSONResponse({ error: 'API endpoint not found' }, 404);
    
  } catch (error) {
    console.error('API Error:', error);
    return createJSONResponse({ 
      error: 'Internal server error', 
      message: error.message 
    }, 500);
  }
}

/**
 * 獲取聚合的 RSS 數據
 */
async function handleGetFeeds(request, env) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const source = url.searchParams.get('source');
  const category = url.searchParams.get('category');
  
  const options = { limit, offset, source, category };
  const result = await getAggregatedFeeds(env, options);
  
  return createJSONResponse(result);
}

/**
 * 獲取特定源的 RSS 數據
 */
async function handleGetFeedBySource(sourceId, request, env) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  
  const cachedData = await getCachedRSSData(env, sourceId);
  
  if (!cachedData) {
    return createJSONResponse({ 
      error: 'Feed not found or not cached yet' 
    }, 404);
  }
  
  const items = cachedData.items || [];
  const paginatedItems = items.slice(offset, offset + limit);
  
  return createJSONResponse({
    source: {
      id: sourceId,
      title: cachedData.title,
      description: cachedData.description,
      link: cachedData.link,
      fetchedAt: cachedData.fetchedAt
    },
    items: paginatedItems,
    total: items.length,
    limit,
    offset,
    hasMore: offset + limit < items.length
  });
}

/**
 * 獲取所有 RSS 源
 */
async function handleGetSources(env) {
  const sources = await getAllRSSSources(env);
  return createJSONResponse({ sources });
}

/**
 * 獲取特定 RSS 源
 */
async function handleGetSource(sourceId, env) {
  const source = await getRSSSource(env, sourceId);
  
  if (!source) {
    return createJSONResponse({ error: 'Source not found' }, 404);
  }
  
  return createJSONResponse({ source });
}

/**
 * 創建新的 RSS 源
 */
async function handleCreateSource(request, env) {
  const body = await request.json();
  const { name, url, description, category = 'general' } = body;
  
  // 驗證必需字段
  if (!name || !url) {
    return createJSONResponse({ 
      error: 'Missing required fields: name, url' 
    }, 400);
  }
  
  // 驗證 URL 格式
  if (!isValidRSSUrl(url)) {
    return createJSONResponse({ 
      error: 'Invalid RSS URL format' 
    }, 400);
  }
  
  // 生成源ID
  const sourceId = generateSourceId(url);
  
  // 檢查是否已存在
  const existingSource = await getRSSSource(env, sourceId);
  if (existingSource) {
    return createJSONResponse({ 
      error: 'RSS source already exists' 
    }, 409);
  }
  
  // 創建源配置
  const sourceConfig = {
    name,
    url,
    description,
    category,
    active: true
  };
  
  await saveRSSSource(env, sourceId, sourceConfig);
  
  return createJSONResponse({ 
    message: 'RSS source created successfully',
    source: { id: sourceId, ...sourceConfig }
  }, 201);
}

/**
 * 更新 RSS 源
 */
async function handleUpdateSource(sourceId, request, env) {
  const body = await request.json();
  const { name, url, description, category, active } = body;
  
  // 獲取現有源
  const existingSource = await getRSSSource(env, sourceId);
  if (!existingSource) {
    return createJSONResponse({ error: 'Source not found' }, 404);
  }
  
  // 更新源配置
  const updatedSource = {
    ...existingSource,
    ...(name && { name }),
    ...(url && { url }),
    ...(description && { description }),
    ...(category && { category }),
    ...(active !== undefined && { active }),
    updatedAt: new Date().toISOString()
  };
  
  // 驗證 URL（如果有提供）
  if (url && !isValidRSSUrl(url)) {
    return createJSONResponse({ 
      error: 'Invalid RSS URL format' 
    }, 400);
  }
  
  await saveRSSSource(env, sourceId, updatedSource);
  
  return createJSONResponse({ 
    message: 'RSS source updated successfully',
    source: updatedSource
  });
}

/**
 * 刪除 RSS 源
 */
async function handleDeleteSource(sourceId, env) {
  const existingSource = await getRSSSource(env, sourceId);
  if (!existingSource) {
    return createJSONResponse({ error: 'Source not found' }, 404);
  }
  
  await deleteRSSSource(env, sourceId);
  
  return createJSONResponse({ 
    message: 'RSS source deleted successfully' 
  });
}

/**
 * 觸發爬蟲
 */
async function handleTriggerCrawler(request, env) {
  const body = await request.json().catch(() => ({}));
  const { sourceId = null } = body;
  
  try {
    const result = await triggerCrawler(env, sourceId);
    return createJSONResponse({ 
      message: 'Crawler triggered successfully',
      result
    });
  } catch (error) {
    return createJSONResponse({ 
      error: 'Crawler failed',
      message: error.message
    }, 500);
  }
}

/**
 * 獲取爬蟲狀態
 */
async function handleGetCrawlerStatus(env) {
  const status = await getCrawlerStatus(env);
  return createJSONResponse({ status });
}

/**
 * 創建 JSON 響應
 * @param {Object} data - 響應數據
 * @param {number} status - HTTP 狀態碼
 * @returns {Response} 響應對象
 */
function createJSONResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

/**
 * 處理 CORS 預檢請求
 * @returns {Response} CORS 響應
 */
export function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
} 