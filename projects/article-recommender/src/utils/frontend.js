/**
 * 前端工具函數 - 相似文章推薦系統
 */

// 全局變量
let lastUpdated = new Date();

/**
 * 獲取搜索JSON數據（帶緩存）
 * @param {Function} callback - 回調函數
 */
function getSearchJSON(callback) {
  var searchData = JSON.parse(localStorage.getItem("blog_" + lastUpdated.valueOf()));
  if (!searchData) {
    localStorage.clear();
    $.getJSON("/search.json", function (data) {
      localStorage.setItem("blog_" + lastUpdated.valueOf(), JSON.stringify(data));
      callback(data);
    });
  } else {
    callback(searchData);
  }
}

/**
 * 獲取相似文章推薦
 * @param {string} blogurl - 文章URL
 * @param {string} containerId - 容器元素ID
 * @param {string} apiBase - API基礎URL
 */
function getSuggestBlog(blogurl, containerId = "suggest-container", apiBase = "") {
  var suggest = $(`#${containerId}`)[0];
  if (!suggest) {
    console.error(`Container with ID "${containerId}" not found`);
    return;
  }
  
  suggest.innerHTML = "Loading...";
  
  $.get(`${apiBase}/suggest?id=${blogurl}&update=${lastUpdated.valueOf()}`, function (data) {
    if (data.length) {
      getSearchJSON(function (search) {
        suggest.innerHTML = '<b>推荐文章</b><hr style="margin: 0 0 5px"/>';
        const searchMap = new Map(search.map(item => [item.url, item]));
        const merged = data.map(suggestObj => {
          const searchObj = searchMap.get(suggestObj.id);
          return searchObj ? { ...searchObj } : null;
        });
        
        merged.forEach(element => {
          if (element) {
            suggest.innerHTML += `<a href="${element.url}">${element.title}</a> - ${element.date}<br />`;
          }
        });
      });
    } else {
      suggest.innerHTML = "暂无推荐文章……";
    }
  }).fail(function() {
    suggest.innerHTML = "获取推荐失败，请稍后重试";
  });
}

/**
 * 獲取文章信息
 * @param {string} articleId - 文章ID
 * @param {string} apiBase - API基礎URL
 * @returns {Promise} 文章信息
 */
async function getArticleInfo(articleId, apiBase = "") {
  try {
    const response = await fetch(`${apiBase}/article_info?id=${articleId}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching article info:', error);
    return null;
  }
}

/**
 * 批量獲取文章信息
 * @param {Array} articleIds - 文章ID數組
 * @param {string} apiBase - API基礎URL
 * @returns {Promise} 文章信息數組
 */
async function getArticlesBatch(articleIds, apiBase = "") {
  try {
    const ids = articleIds.map(id => encodeURIComponent(id)).join(',');
    const response = await fetch(`${apiBase}/articles_batch?ids=${ids}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching articles batch:', error);
    return [];
  }
}

/**
 * 獲取推薦統計信息
 * @param {string} apiBase - API基礎URL
 * @returns {Promise} 統計信息
 */
async function getRecommendationStats(apiBase = "") {
  try {
    const response = await fetch(`${apiBase}/recommendation_stats`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching recommendation stats:', error);
    return null;
  }
}

/**
 * 清除推薦緩存
 * @param {string} apiBase - API基礎URL
 * @returns {Promise} 操作結果
 */
async function clearSuggestCache(apiBase = "") {
  try {
    const response = await fetch(`${apiBase}/clear_suggest_cache`, {
      method: 'POST'
    });
    return await response.json();
  } catch (error) {
    console.error('Error clearing suggest cache:', error);
    return null;
  }
}

/**
 * 創建推薦組件
 * @param {string} containerId - 容器ID
 * @param {Object} options - 配置選項
 */
function createRecommendationWidget(containerId, options = {}) {
  const defaultOptions = {
    title: "推荐文章",
    loadingText: "Loading...",
    emptyText: "暂无推荐文章……",
    errorText: "获取推荐失败，请稍后重试",
    showDate: true,
    maxItems: 5,
    apiBase: ""
  };
  
  const config = { ...defaultOptions, ...options };
  
  return {
    container: document.getElementById(containerId),
    config: config,
    
    /**
     * 顯示推薦文章
     * @param {string} articleId - 文章ID
     */
    showRecommendations: function(articleId) {
      if (!this.container) {
        console.error(`Container with ID "${containerId}" not found`);
        return;
      }
      
      this.container.innerHTML = config.loadingText;
      
      fetch(`${config.apiBase}/suggest?id=${articleId}&update=${lastUpdated.valueOf()}`)
        .then(response => response.json())
        .then(data => {
          if (data.length) {
            this.renderRecommendations(data);
          } else {
            this.container.innerHTML = config.emptyText;
          }
        })
        .catch(error => {
          console.error('Error fetching recommendations:', error);
          this.container.innerHTML = config.errorText;
        });
    },
    
    /**
     * 渲染推薦列表
     * @param {Array} recommendations - 推薦數據
     */
    renderRecommendations: function(recommendations) {
      this.container.innerHTML = `<b>${config.title}</b><hr style="margin: 0 0 5px"/>`;
      
      const limitedRecommendations = recommendations.slice(0, config.maxItems);
      
      limitedRecommendations.forEach(item => {
        const dateText = config.showDate ? ` - ${item.date}` : '';
        this.container.innerHTML += `<a href="${item.id}">${item.title || item.id}</a>${dateText}<br />`;
      });
    }
  };
}

// 導出函數（如果使用模塊系統）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getSearchJSON,
    getSuggestBlog,
    getArticleInfo,
    getArticlesBatch,
    getRecommendationStats,
    clearSuggestCache,
    createRecommendationWidget
  };
} 