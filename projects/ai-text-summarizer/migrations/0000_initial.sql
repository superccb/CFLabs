-- 創建博客摘要表
CREATE TABLE IF NOT EXISTS blog_summary (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    summary TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 創建點擊計數表
CREATE TABLE IF NOT EXISTS counter (
    url TEXT PRIMARY KEY,
    counter INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_blog_summary_created_at ON blog_summary(created_at);
CREATE INDEX IF NOT EXISTS idx_counter_updated_at ON counter(updated_at); 