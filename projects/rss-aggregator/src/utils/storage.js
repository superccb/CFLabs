/**
 * KV 存儲工具
 * 提供 RSS 數據和源配置的存儲功能
 */

/**
 * 存儲 RSS 源配置
 * @param {Object} env - 環境變數
 * @param {string} sourceId - 源ID
 * @param {Object} sourceConfig - 源配置
 */
export async function saveRSSSource(env, sourceId, sourceConfig) {
  const key = `source:${sourceId}`;
  const value = JSON.stringify({
    ...sourceConfig,
    id: sourceId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  await env.RSS_SOURCES.put(key, value);
}

/**
 * 獲取 RSS 源配置
 * @param {Object} env - 環境變數
 * @param {string} sourceId - 源ID
 * @returns {Promise<Object|null>} 源配置
 */
export async function getRSSSource(env, sourceId) {
  const key = `source:${sourceId}`;
  const value = await env.RSS_SOURCES.get(key);
  
  return value ? JSON.parse(value) : null;
}

/**
 * 獲取所有 RSS 源配置
 * @param {Object} env - 環境變數
 * @returns {Promise<Array>} 所有源配置
 */
export async function getAllRSSSources(env) {
  const sources = [];
  const list = await env.RSS_SOURCES.list({ prefix: 'source:' });
  
  for (const key of list.keys) {
    const value = await env.RSS_SOURCES.get(key.name);
    if (value) {
      sources.push(JSON.parse(value));
    }
  }
  
  return sources;
}

/**
 * 刪除 RSS 源配置
 * @param {Object} env - 環境變數
 * @param {string} sourceId - 源ID
 */
export async function deleteRSSSource(env, sourceId) {
  const key = `source:${sourceId}`;
  await env.RSS_SOURCES.delete(key);
  
  // 同時刪除相關的緩存數據
  await env.RSS_CACHE.delete(`feed:${sourceId}`);
}

/**
 * 存儲 RSS 數據到緩存
 * @param {Object} env - 環境變數
 * @param {string} sourceId - 源ID
 * @param {Object} rssData - RSS 數據
 */
export async function cacheRSSData(env, sourceId, rssData) {
  const key = `feed:${sourceId}`;
  const value = JSON.stringify({
    ...rssData,
    cachedAt: new Date().toISOString()
  });
  
  // 設置7天過期時間
  await env.RSS_CACHE.put(key, value, { expirationTtl: 7 * 24 * 60 * 60 });
}

/**
 * 獲取緩存的 RSS 數據
 * @param {Object} env - 環境變數
 * @param {string} sourceId - 源ID
 * @returns {Promise<Object|null>} 緩存的 RSS 數據
 */
export async function getCachedRSSData(env, sourceId) {
  const key = `feed:${sourceId}`;
  const value = await env.RSS_CACHE.get(key);
  
  return value ? JSON.parse(value) : null;
}

/**
 * 獲取所有緩存的 RSS 數據
 * @param {Object} env - 環境變數
 * @returns {Promise<Array>} 所有緩存的 RSS 數據
 */
export async function getAllCachedRSSData(env) {
  const feeds = [];
  const list = await env.RSS_CACHE.list({ prefix: 'feed:' });
  
  for (const key of list.keys) {
    const value = await env.RSS_CACHE.get(key.name);
    if (value) {
      feeds.push(JSON.parse(value));
    }
  }
  
  return feeds;
}

/**
 * 存儲聚合數據
 * @param {Object} env - 環境變數
 * @param {Array} aggregatedData - 聚合數據
 */
export async function saveAggregatedData(env, aggregatedData) {
  const key = 'aggregated:latest';
  const value = JSON.stringify({
    items: aggregatedData,
    updatedAt: new Date().toISOString(),
    count: aggregatedData.length
  });
  
  // 設置1天過期時間
  await env.RSS_CACHE.put(key, value, { expirationTtl: 24 * 60 * 60 });
}

/**
 * 獲取聚合數據
 * @param {Object} env - 環境變數
 * @returns {Promise<Object|null>} 聚合數據
 */
export async function getAggregatedData(env) {
  const key = 'aggregated:latest';
  const value = await env.RSS_CACHE.get(key);
  
  return value ? JSON.parse(value) : null;
}

/**
 * 清除過期緩存
 * @param {Object} env - 環境變數
 */
export async function clearExpiredCache(env) {
  // KV 會自動清除過期的鍵值對，這裡只是預留接口
  console.log('Cache cleanup completed');
}

/**
 * 生成源ID
 * @param {string} url - RSS URL
 * @returns {string} 生成的源ID
 */
export function generateSourceId(url) {
  return url.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
}

/**
 * 初始化默認 RSS 源
 * @param {Object} env - 環境變數
 */
export async function initializeDefaultSources(env) {
  const defaultSources = [
    {
      id: 'hackernews',
      name: 'Hacker News',
      url: 'https://feeds.feedburner.com/ycombinator',
      description: 'Latest stories from Hacker News',
      category: 'tech',
      active: true
    },
    {
      id: 'github_trending',
      name: 'GitHub Trending',
      url: 'https://github.com/trending.atom',
      description: 'Trending repositories on GitHub',
      category: 'tech',
      active: true
    },
    {
      id: 'dev_to',
      name: 'Dev.to',
      url: 'https://dev.to/feed',
      description: 'Latest articles from Dev.to',
      category: 'tech',
      active: true
    }
  ];

  for (const source of defaultSources) {
    const existing = await getRSSSource(env, source.id);
    if (!existing) {
      await saveRSSSource(env, source.id, source);
    }
  }
} 