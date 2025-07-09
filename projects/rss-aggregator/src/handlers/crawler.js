/**
 * RSS 爬蟲邏輯
 * 負責爬取、聚合和處理 RSS 數據
 */

import { fetchRSS } from '../utils/rss-parser.js';
import { 
  getAllRSSSources, 
  cacheRSSData, 
  saveAggregatedData,
  getAllCachedRSSData,
  initializeDefaultSources
} from '../utils/storage.js';

/**
 * 執行 RSS 爬蟲任務
 * @param {Object} env - 環境變數
 * @returns {Promise<Object>} 爬蟲結果
 */
export async function runCrawler(env) {
  console.log('Starting RSS crawler...');
  
  try {
    // 初始化默認源（如果不存在）
    await initializeDefaultSources(env);
    
    // 獲取所有活躍的 RSS 源
    const sources = await getAllRSSSources(env);
    const activeSources = sources.filter(source => source.active);
    
    console.log(`Found ${activeSources.length} active RSS sources`);
    
    const results = {
      success: [],
      failed: [],
      totalItems: 0,
      startTime: new Date().toISOString()
    };
    
    // 並行處理所有源
    const crawlPromises = activeSources.map(async (source) => {
      try {
        const rssData = await fetchRSS(source.url);
        
        // 為每個項目添加源信息
        rssData.items.forEach(item => {
          item.sourceId = source.id;
          item.sourceName = source.name;
          item.sourceCategory = source.category;
        });
        
        // 緩存 RSS 數據
        await cacheRSSData(env, source.id, rssData);
        
        results.success.push({
          sourceId: source.id,
          sourceName: source.name,
          itemCount: rssData.items.length,
          fetchedAt: rssData.fetchedAt
        });
        
        results.totalItems += rssData.items.length;
        
        console.log(`Successfully crawled ${source.name}: ${rssData.items.length} items`);
        
        return rssData;
      } catch (error) {
        console.error(`Failed to crawl ${source.name}:`, error.message);
        
        results.failed.push({
          sourceId: source.id,
          sourceName: source.name,
          error: error.message
        });
        
        return null;
      }
    });
    
    // 等待所有爬蟲任務完成
    const crawlResults = await Promise.all(crawlPromises);
    const validResults = crawlResults.filter(result => result !== null);
    
    // 聚合所有數據
    const aggregatedData = await aggregateRSSData(validResults);
    
    // 保存聚合數據
    await saveAggregatedData(env, aggregatedData);
    
    results.endTime = new Date().toISOString();
    results.aggregatedItems = aggregatedData.length;
    
    console.log('RSS crawler completed successfully');
    
    return results;
  } catch (error) {
    console.error('RSS crawler failed:', error);
    throw error;
  }
}

/**
 * 聚合 RSS 數據
 * @param {Array} rssDataArray - RSS 數據數組
 * @returns {Promise<Array>} 聚合後的數據
 */
export async function aggregateRSSData(rssDataArray) {
  const allItems = [];
  const seenIds = new Set();
  
  // 收集所有項目
  for (const rssData of rssDataArray) {
    if (rssData && rssData.items) {
      for (const item of rssData.items) {
        // 去重處理
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          allItems.push(item);
        }
      }
    }
  }
  
  // 按發布時間排序（最新的在前）
  allItems.sort((a, b) => {
    const dateA = new Date(a.publishedAt || a.pubDate || 0);
    const dateB = new Date(b.publishedAt || b.pubDate || 0);
    return dateB - dateA;
  });
  
  // 限制數量（保留最新的1000條）
  return allItems.slice(0, 1000);
}

/**
 * 獲取聚合的 RSS 數據
 * @param {Object} env - 環境變數
 * @param {Object} options - 選項
 * @returns {Promise<Object>} 聚合數據
 */
export async function getAggregatedFeeds(env, options = {}) {
  const { limit = 50, offset = 0, source = null, category = null } = options;
  
  try {
    // 從緩存獲取聚合數據
    const cachedData = await getAllCachedRSSData(env);
    
    if (cachedData.length === 0) {
      return {
        items: [],
        total: 0,
        message: 'No data available. Please wait for the crawler to run.'
      };
    }
    
    // 合併所有緩存數據
    const allItems = [];
    const seenIds = new Set();
    
    for (const feedData of cachedData) {
      if (feedData.items) {
        for (const item of feedData.items) {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            allItems.push(item);
          }
        }
      }
    }
    
    // 過濾條件
    let filteredItems = allItems;
    
    if (source) {
      filteredItems = filteredItems.filter(item => item.sourceId === source);
    }
    
    if (category) {
      filteredItems = filteredItems.filter(item => item.sourceCategory === category);
    }
    
    // 排序
    filteredItems.sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.pubDate || 0);
      const dateB = new Date(b.publishedAt || b.pubDate || 0);
      return dateB - dateA;
    });
    
    // 分頁
    const paginatedItems = filteredItems.slice(offset, offset + limit);
    
    return {
      items: paginatedItems,
      total: filteredItems.length,
      limit,
      offset,
      hasMore: offset + limit < filteredItems.length
    };
  } catch (error) {
    console.error('Failed to get aggregated feeds:', error);
    throw error;
  }
}

/**
 * 手動觸發爬蟲
 * @param {Object} env - 環境變數
 * @param {string} sourceId - 特定源ID（可選）
 * @returns {Promise<Object>} 爬蟲結果
 */
export async function triggerCrawler(env, sourceId = null) {
  console.log('Manual crawler trigger');
  
  try {
    if (sourceId) {
      // 爬取特定源
      const sources = await getAllRSSSources(env);
      const source = sources.find(s => s.id === sourceId);
      
      if (!source) {
        throw new Error(`Source not found: ${sourceId}`);
      }
      
      const rssData = await fetchRSS(source.url);
      rssData.items.forEach(item => {
        item.sourceId = source.id;
        item.sourceName = source.name;
        item.sourceCategory = source.category;
      });
      
      await cacheRSSData(env, source.id, rssData);
      
      return {
        success: true,
        sourceId: source.id,
        itemCount: rssData.items.length,
        fetchedAt: rssData.fetchedAt
      };
    } else {
      // 爬取所有源
      return await runCrawler(env);
    }
  } catch (error) {
    console.error('Manual crawler failed:', error);
    throw error;
  }
}

/**
 * 獲取爬蟲狀態
 * @param {Object} env - 環境變數
 * @returns {Promise<Object>} 爬蟲狀態
 */
export async function getCrawlerStatus(env) {
  try {
    const sources = await getAllRSSSources(env);
    const cachedData = await getAllCachedRSSData(env);
    
    const status = {
      totalSources: sources.length,
      activeSources: sources.filter(s => s.active).length,
      cachedFeeds: cachedData.length,
      lastUpdate: null,
      sources: []
    };
    
    // 獲取每個源的狀態
    for (const source of sources) {
      const cached = cachedData.find(c => c.sourceUrl === source.url);
      status.sources.push({
        id: source.id,
        name: source.name,
        active: source.active,
        lastFetch: cached ? cached.fetchedAt : null,
        itemCount: cached ? cached.items.length : 0
      });
      
      // 更新最後更新時間
      if (cached && cached.fetchedAt) {
        if (!status.lastUpdate || new Date(cached.fetchedAt) > new Date(status.lastUpdate)) {
          status.lastUpdate = cached.fetchedAt;
        }
      }
    }
    
    return status;
  } catch (error) {
    console.error('Failed to get crawler status:', error);
    throw error;
  }
} 