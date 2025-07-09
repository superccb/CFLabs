/**
 * RSS 解析器工具
 * 使用原生 Web API 解析 RSS XML 格式
 */

/**
 * 解析 RSS XML 文檔
 * @param {string} xmlString - RSS XML 字符串
 * @returns {Object} 解析後的 RSS 數據
 */
export function parseRSS(xmlString) {
  try {
    // 使用 DOMParser 解析 XML
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');
    
    // 檢查是否有解析錯誤
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error('XML parsing error: ' + parserError.textContent);
    }

    // 提取頻道信息
    const channel = doc.querySelector('rss > channel') || doc.querySelector('channel');
    if (!channel) {
      throw new Error('Invalid RSS format: no channel found');
    }

    const rssData = {
      title: getTextContent(channel, 'title'),
      description: getTextContent(channel, 'description'),
      link: getTextContent(channel, 'link'),
      lastBuildDate: getTextContent(channel, 'lastBuildDate'),
      items: []
    };

    // 提取文章項目
    const items = channel.querySelectorAll('item');
    items.forEach(item => {
      const article = {
        title: getTextContent(item, 'title'),
        description: getTextContent(item, 'description'),
        link: getTextContent(item, 'link'),
        pubDate: getTextContent(item, 'pubDate'),
        guid: getTextContent(item, 'guid'),
        category: getTextContent(item, 'category'),
        author: getTextContent(item, 'author') || getTextContent(item, 'dc:creator'),
        content: getTextContent(item, 'content:encoded')
      };

      // 生成唯一ID
      article.id = article.guid || generateId(article.title + article.link);
      
      // 標準化發布時間
      if (article.pubDate) {
        article.publishedAt = new Date(article.pubDate).toISOString();
      }

      rssData.items.push(article);
    });

    return rssData;
  } catch (error) {
    throw new Error(`RSS parsing failed: ${error.message}`);
  }
}

/**
 * 獲取元素文本內容
 * @param {Element} parent - 父元素
 * @param {string} selector - 選擇器
 * @returns {string} 文本內容
 */
function getTextContent(parent, selector) {
  const element = parent.querySelector(selector);
  return element ? element.textContent.trim() : '';
}

/**
 * 生成內容ID
 * @param {string} content - 內容字符串
 * @returns {string} 生成的ID
 */
function generateId(content) {
  // 簡單的hash函數生成ID
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 轉換為32位整數
  }
  return Math.abs(hash).toString(36);
}

/**
 * 獲取 RSS 源數據
 * @param {string} url - RSS URL
 * @returns {Promise<Object>} RSS 數據
 */
export async function fetchRSS(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RSS-Aggregator/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlString = await response.text();
    const rssData = parseRSS(xmlString);
    
    // 添加源信息
    rssData.sourceUrl = url;
    rssData.fetchedAt = new Date().toISOString();
    
    return rssData;
  } catch (error) {
    throw new Error(`Failed to fetch RSS from ${url}: ${error.message}`);
  }
}

/**
 * 驗證 RSS URL 格式
 * @param {string} url - RSS URL
 * @returns {boolean} 是否有效
 */
export function isValidRSSUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
} 