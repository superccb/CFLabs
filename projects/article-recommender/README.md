# 相似文章推薦系統

基於Cloudflare Vectorize的智能文章推薦系統，使用向量相似度算法為用戶推薦相關文章。

## 功能特性

- 🎯 **智能推薦**：基於向量相似度的精準推薦
- ⚡ **高性能**：緩存機制提升響應速度
- 🔄 **自動更新**：支持文章內容變更檢測
- 📱 **前端友好**：提供完整的前端工具函數
- 📊 **統計分析**：推薦效果統計和監控
- 🌐 **跨域支持**：完整的CORS配置

## 技術架構

### 核心組件

- **Cloudflare Workers**：無服務器運行環境
- **Cloudflare Vectorize**：向量數據庫（768維度，餘弦相似度）
- **Cloudflare D1**：關係型數據庫存儲文章信息和緩存

### 推薦算法

1. **向量檢索**：根據文章ID獲取對應向量
2. **相似度計算**：使用餘弦相似度查詢最相似的文章
3. **結果過濾**：移除當前文章，返回Top-K推薦
4. **緩存優化**：緩存推薦結果避免重複計算

## API端點

### 文章推薦
```
GET /suggest?id=文章ID&update=時間戳
```

**響應格式：**
```json
[
  {
    "id": "文章ID",
    "score": 0.85,
    "values": [0.1, 0.2, ...]
  }
]
```

### 搜索數據
```
GET /search.json
```

**響應格式：**
```json
[
  {
    "id": "文章ID",
    "title": "文章標題",
    "url": "文章URL",
    "date": "發布日期"
  }
]
```

### 文章信息
```
GET /article_info?id=文章ID
```

### 批量文章信息
```
GET /articles_batch?ids=ID1,ID2,ID3
```

### 推薦統計
```
GET /recommendation_stats
```

### 清除緩存
```
POST /clear_suggest_cache
```

## 數據庫結構

### blog_summary表擴展
```sql
ALTER TABLE blog_summary ADD COLUMN suggest TEXT;
ALTER TABLE blog_summary ADD COLUMN suggest_update TEXT;
```

**完整表結構：**
```sql
CREATE TABLE blog_summary (
  id TEXT PRIMARY KEY,
  content TEXT,
  summary TEXT,
  title TEXT,
  url TEXT,
  date TEXT,
  is_vec INTEGER DEFAULT 0,
  suggest TEXT,
  suggest_update TEXT
);
```

## 前端集成

### 基本使用

```html
<!-- 引入jQuery和工具函數 -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="/src/utils/frontend.js"></script>

<!-- 推薦容器 -->
<div id="suggest-container"></div>

<script>
// 獲取當前文章推薦
getSuggestBlog('current-article-id');
</script>
```

### 高級組件

```javascript
// 創建推薦組件
const recommender = createRecommendationWidget('suggest-container', {
  title: '相關文章',
  maxItems: 6,
  showDate: true,
  apiBase: 'https://your-api.com'
});

// 顯示推薦
recommender.showRecommendations('article-id');
```

### 自定義實現

```javascript
// 獲取推薦數據
fetch('/suggest?id=article-id&update=timestamp')
  .then(response => response.json())
  .then(recommendations => {
    // 處理推薦結果
    recommendations.forEach(item => {
      console.log(`推薦文章: ${item.id}, 相似度: ${item.score}`);
    });
  });

// 批量獲取文章信息
getArticlesBatch(['id1', 'id2', 'id3'])
  .then(articles => {
    articles.forEach(article => {
      console.log(`文章: ${article.title}`);
    });
  });
```

## 部署步驟

1. **安裝依賴**
   ```bash
   npm install
   ```

2. **配置環境**
   - 修改 `wrangler.toml` 中的數據庫ID
   - 確保Vectorize索引已創建（768維度，餘弦相似度）

3. **數據庫準備**
   ```sql
   -- 添加推薦相關字段
   ALTER TABLE blog_summary ADD COLUMN suggest TEXT;
   ALTER TABLE blog_summary ADD COLUMN suggest_update TEXT;
   ```

4. **本地開發**
   ```bash
   npm run dev
   ```

5. **部署到Cloudflare**
   ```bash
   npm run deploy
   ```

## 配置說明

### wrangler.toml
```toml
name = "article-recommender"
main = "src/index.js"
compatibility_date = "2024-01-01"

[[vectorize]]
binding = "MAYX_INDEX"
index_name = "mayx-index"
dimensions = 768
metric = "cosine"

[[d1_databases]]
binding = "BLOG_SUMMARY"
database_name = "blog-summary"
database_id = "your-database-id"
```

## 性能優化

### 緩存策略

1. **推薦結果緩存**：避免重複計算相似度
2. **前端數據緩存**：使用localStorage緩存搜索JSON
3. **更新檢測**：通過時間戳判斷是否需要重新計算

### 查詢優化

1. **批量查詢**：支持批量獲取文章信息
2. **索引優化**：使用向量數據庫的索引加速查詢
3. **結果限制**：限制返回結果數量

## 監控和分析

### 統計端點

```javascript
// 獲取推薦統計
getRecommendationStats()
  .then(stats => {
    console.log(`總文章數: ${stats.total_articles}`);
    console.log(`有推薦的文章數: ${stats.articles_with_suggestions}`);
    console.log(`已向量化的文章數: ${stats.vectorized_articles}`);
  });
```

### 性能指標

- 推薦響應時間
- 緩存命中率
- 推薦準確度
- 用戶點擊率

## 注意事項

1. **向量數據庫**：確保Vectorize索引維度與嵌入模型匹配
2. **緩存管理**：定期清理過期緩存
3. **錯誤處理**：前端需要處理API錯誤情況
4. **跨域配置**：確保CORS設置正確

## 開發計劃

- [ ] 支持多種推薦算法
- [ ] 添加用戶行為分析
- [ ] 實現A/B測試框架
- [ ] 支持實時推薦更新
- [ ] 添加推薦效果評估

## 許可證

MIT License 