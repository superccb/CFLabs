# Cloudflare 功能與更新追蹤

## 項目概述

本文檔用於追蹤 Cloudflare 平台的重要功能更新、改進和新增服務。我們關注影響開發者工作流程和產品能力的重大變更，特別是與 Workers、AI、邊緣計算相關的功能。

## 文檔目的

- 追蹤 Cloudflare 產品功能演進
- 記錄重要的 API 和工具變更
- 提供功能採用決策參考
- 維護技術債務清單

---

## 最新更新 (2025年)

### [2025-06-25] Building agents with OpenAI and Cloudflare's Agents SDK

**類型**: 功能整合 
**狀態**: 正式發布 (GA)  
**重要程度**: ⭐⭐⭐⭐⭐

#### 主要特性
- **OpenAI Agents SDK 整合**: 與 OpenAI 的 Agents SDK 深度整合，提供認知層面的支持
- **多Agent系統支持**: 可建立專門化Agent協同工作的系統
- **人機協作流程**: 支持 human-in-the-loop 模式，允許人工干預決策點
- **可尋址Agent**: Agent 可通過電話、電子郵件、WebSocket 等多種方式訪問

#### 技術亮點
```typescript
export class MyAgent extends Agent {
  async onConnect(connection: Connection, ctx: ConnectionContext) {
    const agent = new RealtimeAgent({
      instructions: "You are a helpful assistant...",
      name: "Triage Agent",
    });
    // 支持實時語音、視頻、文本交互
  }
}
```

#### 影響範圍
- **開發者體驗**: 簡化AI Agent開發流程
- **用例拓展**: 支持客服、教育、多模態交互等場景
- **架構模式**: 微服務化的Agent組合架構

#### 相關連結
- [博客文章](https://blog.cloudflare.com/building-agents-with-openai-and-cloudflares-agents-sdk/)

---

### [2025-06-24] Cloudflare Containers 公開測試版

**類型**: 新產品發布  
**狀態**: 公開測試版 (Public Beta)  
**重要程度**: ⭐⭐⭐⭐⭐

#### 主要特性
- **全球容器部署**: Region:Earth 部署模式，無需管理區域配置
- **與Workers緊密整合**: 容器與Workers之間輕鬆路由和通信
- **按需計費**: 按實際使用時間計費（每10ms計費單位）
- **簡化開發流程**: `wrangler dev` 和 `wrangler deploy` 一鍵部署

#### 技術規格

| 實例類型 | 記憶體 | CPU | 磁盤 |
|---------|-------|-----|------|
| dev | 256 MiB | 1/16 vCPU | 2 GB |
| basic | 1 GiB | 1/4 vCPU | 4 GB |
| standard | 4 GiB | 1/2 vCPU | 4 GB |

#### 配置示例
```javascript
export class MyContainer extends Container {
  defaultPort = 8080;
  sleepAfter = '5m';
}

// wrangler.jsonc
{
  "containers": [
    {
      "class_name": "ContainerSandbox",
      "image": "./Dockerfile",
      "max_instances": 80,
      "instance_type": "basic"
    }
  ]
}
```

#### 應用場景
- 媒體處理（FFmpeg視頻轉換）
- 代碼沙盒執行
- 批處理任務
- 多語言後端服務

#### 即將推出功能
- 更高限制和更大實例
- 全球自動擴展和延遲感知路由
- 更多Workers-Container通信方式

#### 相關連結
- [博客文章](https://blog.cloudflare.com/containers-are-available-in-public-beta-for-simple-global-and-programmable/)

---

### [2025-04-08] Workers 全棧開發能力重大升級

**類型**: 平台升級  
**狀態**: 正式發布 (GA)  
**重要程度**: ⭐⭐⭐⭐⭐

#### 核心改進

##### 1. 框架支持 (GA)
- **React Router v7 (Remix)**: 正式支持
- **Astro**: 正式支持
- **Hono**: 正式支持  
- **Vue.js, Nuxt**: 正式支持
- **Svelte (SvelteKit)**: 正式支持
- **Next.js**: @opennextjs/cloudflare 達到 v1.0-beta

##### 2. 開發工具改進
- **Cloudflare Vite Plugin**: 達到 v1.0 GA
- **靜態配置文件**: 支持 `_headers` 和 `_redirects`
- **無框架全棧開發**: 可以"僅使用 Vite"和React構建完整應用

##### 3. 數據庫連接擴展
- **MySQL支持**: 通過Hyperdrive連接MySQL數據庫
- **支持平台**: Planetscale, AWS, GCP, Azure等
- **連接池**: Hyperdrive處理連接池和查詢緩存

##### 4. 運行時增強
- **Node.js API擴展**: 新增 `crypto`, `tls`, `net`, `dns` 模組
- **CPU時間延長**: 從30秒增加到5分鐘
- **環境變量**: `process.env` 原生支持

##### 5. Workers Builds 改進
- **構建速度**: 啟動延遲減少6秒
- **GitHub整合**: 支持非生產分支的預覽URL
- **API響應**: 通過Smart Placement提升7倍性能

##### 6. Images API
- **Images binding**: 正式發布GA
- **程式化工作流**: 支持更靈活的圖像處理

#### 架構優勢

```javascript
// 單個Worker中的全棧應用
export default {
  async fetch(request, env) {
    const pathname = new URL(request.url).pathname;
    
    // API路由
    if (pathname.startsWith('/api/')) {
      return handleAPI(request, env);
    }
    
    // 靜態資源自動服務
    // 支持SSR和SPA模式
    return handleStaticAssets(request);
  }
}
```

#### 戰略意義
- **統一平台**: Workers成為主要開發平台，Pages功能整合到Workers
- **簡化架構**: 前端、後端、數據庫統一在一個Worker中
- **全球部署**: 無需配置多區域，自動全球分發

#### 相關連結
- [博客文章](https://blog.cloudflare.com/full-stack-development-on-cloudflare-workers/)

---

### [2025-05-29] Workers Builds 錯誤檢測系統

**類型**: 平台可靠性改進  
**狀態**: 正式發布  
**重要程度**: ⭐⭐⭐

#### 主要特性
- **自動錯誤檢測**: 使用Durable Objects和Queues構建錯誤檢測管道
- **歷史分析**: 回溯分析超過100萬個構建記錄
- **智能分類**: 正則表達式匹配和錯誤分組
- **主動修復**: 基於錯誤模式主動識別和修復問題

#### 技術架構
```javascript
// 使用Durable Objects的錯誤檢測Agent
export class BuildErrorsAgent extends DurableObject {
  async alarm() {
    // 每秒執行，批量處理構建錯誤
    const failedBuilds = await this.store.builds.selectFailedBuilds({
      min_build_id: this.state.latest_build_id + 1,
      limit: 1000,
    });
    
    await this.env.BUILD_ERRORS_QUEUE.sendBatch(
      failedBuilds.map(build => ({ body: build }))
    );
  }
}
```

#### 改進成果
- **Wrangler錯誤訊息**: 配置文件未找到時顯示更清晰錯誤
- **包管理器修復**: TypeScript/JavaScript項目中的邊緣案例
- **Bun支持**: 新增bun.lock支持
- **Python支持**: runtime.txt文件指定Python版本
- **構建緩存**: Monorepo中的多個邊緣案例修復

#### 相關連結
- [博客文章](https://blog.cloudflare.com/detecting-workers-builds-errors-across-1-million-durable-durable-objects/)

---

### [2025-02-25] AI Agents SDK 和 Workers AI 增強

**類型**: AI平台擴展  
**狀態**: 正式發布  
**重要程度**: ⭐⭐⭐⭐

#### 新功能發布

##### 1. agents-sdk 框架
```bash
# 快速開始
npm i agents-sdk
# 或使用模板
npm create cloudflare@latest -- --template cloudflare/agents-starter
```

##### 2. Workers AI 增強
- **JSON模式**: 結構化輸出支持
- **工具調用**: 增強的function calling
- **更長上下文窗口**: 支援更大的輸入
- **支持模型擴展**: 包括Llama 3.1、DeepSeek等

##### 3. workers-ai-provider 更新
- **工具調用**: generateText的工具調用功能
- **串流支持**: 開箱即用的串流
- **使用統計**: 啟用使用情況統計
- **AI Gateway**: 串流時也支持AI Gateway

#### 技術特色
```javascript
// AI Chat Agent 示例
export class Chat extends AIChatAgent<Env> {
  async onChatMessage(onFinish) {
    return agentContext.run(this, async () => {
      const result = streamText({
        model: openai("gpt-4o-2024-11-20"),
        system: `You are a helpful assistant...`,
        messages: this.messages,
        tools,
        onFinish,
        maxSteps: 10,
      });
      
      result.mergeIntoDataStream(dataStream);
    });
  }
}
```

#### 平台優勢
- **按使用付費**: CPU時間計費vs壁鐘時間
- **無伺服器推理**: Workers AI按需計費
- **持久化執行**: Durable Objects和Workflows保證執行
- **全球網絡**: 低延遲AI推理

#### 相關連結
- [博客文章](https://blog.cloudflare.com/build-ai-agents-on-cloudflare/)

---

## 功能採用建議

### 高優先級採用
1. **Cloudflare Containers** - 適合需要特定運行環境的應用
2. **全棧Workers** - 統一前後端開發流程
3. **AI Agents SDK** - 智能應用開發

### 中優先級採用
1. **MySQL Hyperdrive** - 現有MySQL應用遷移
2. **Images API** - 圖像處理工作流優化

### 評估中功能
1. **Containers自動擴展** - 等待GA發布
2. **更大Containers實例** - 等待更高限制

---

## 技術債務追蹤

### 待升級項目
- [ ] 評估現有Pages項目遷移到Workers
- [ ] 分析Containers vs Workers適用場景
- [ ] 規劃AI Agent整合策略

### 實驗性功能
- [ ] 測試Containers在生產環境的表現
- [ ] 評估AI Agents在實際業務中的應用
- [ ] 探索多Agent系統架構模式

---

## 相關資源

### 官方文檔
- [Cloudflare Workers 文檔](https://developers.cloudflare.com/workers/)
- [Containers 文檔](https://developers.cloudflare.com/containers/)
- [AI Agents 文檔](https://developers.cloudflare.com/agents/)

### 社群資源
- [Cloudflare Discord](https://discord.cloudflare.com/)
- [Workers Examples](https://github.com/cloudflare/workers-examples)

---

*最後更新: 2025-01-06*  
*文檔維護: 開發團隊* 