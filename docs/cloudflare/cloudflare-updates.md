# Cloudflare Features and Updates Tracker

## Project Overview

This document is used to track important feature updates, improvements, and new services on the Cloudflare platform. We focus on major changes that impact developer workflows and product capabilities, especially features related to Workers, AI, and edge computing.

## Document Purpose

- Track the evolution of Cloudflare product features
- Record important API and tool changes
- Provide references for feature adoption decisions
- Maintain a technical debt list

---

## Latest Updates (2025)

### [2025-06-25] Building agents with OpenAI and Cloudflare's Agents SDK

**Type**: Feature Integration  
**Status**: General Availability (GA)  
**Importance**: ⭐⭐⭐⭐⭐

#### Key Features
- **OpenAI Agents SDK Integration**: Deep integration with OpenAI's Agents SDK, providing cognitive layer support
- **Multi-Agent System Support**: Ability to build systems where specialized agents collaborate
- **Human-in-the-Loop Workflow**: Supports human-in-the-loop mode, allowing manual intervention at decision points
- **Addressable Agents**: Agents can be accessed via phone, email, WebSocket, and more

#### Technical Highlights
```typescript
export class MyAgent extends Agent {
  async onConnect(connection: Connection, ctx: ConnectionContext) {
    const agent = new RealtimeAgent({
      instructions: "You are a helpful assistant...",
      name: "Triage Agent",
    });
    // Supports real-time voice, video, and text interaction
  }
}
```

#### Impact
- **Developer Experience**: Simplifies AI agent development
- **Use Case Expansion**: Supports scenarios such as customer service, education, multimodal interaction
- **Architecture Pattern**: Microservice-style agent composition

#### Related Links
- [Blog Post](https://blog.cloudflare.com/building-agents-with-openai-and-cloudflares-agents-sdk/)

---

### [2025-06-24] Cloudflare Containers Public Beta

**Type**: New Product Release  
**Status**: Public Beta  
**Importance**: ⭐⭐⭐⭐⭐

#### Key Features
- **Global Container Deployment**: Region:Earth deployment mode, no need to manage region configuration
- **Tight Integration with Workers**: Easy routing and communication between containers and Workers
- **Usage-Based Billing**: Billed by actual usage time (10ms billing unit)
- **Simplified Development Flow**: `wrangler dev` and `wrangler deploy` for one-click deployment

#### Technical Specs

| Instance Type | Memory   | CPU        | Disk |
|--------------|----------|------------|------|
| dev          | 256 MiB  | 1/16 vCPU  | 2 GB |
| basic        | 1 GiB    | 1/4 vCPU   | 4 GB |
| standard     | 4 GiB    | 1/2 vCPU   | 4 GB |

#### Configuration Example
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

#### Application Scenarios
- Media processing (FFmpeg video transcoding)
- Code sandbox execution
- Batch processing tasks
- Multi-language backend services

#### Upcoming Features
- Higher limits and larger instances
- Global auto-scaling and latency-aware routing
- More Workers-Container communication methods

#### Related Links
- [Blog Post](https://blog.cloudflare.com/containers-are-available-in-public-beta-for-simple-global-and-programmable/)

---

### [2025-04-08] Major Upgrade to Workers Full-Stack Development Capabilities

**Type**: Platform Upgrade  
**Status**: General Availability (GA)  
**Importance**: ⭐⭐⭐⭐⭐

#### Core Improvements

##### 1. Framework Support (GA)
- **React Router v7 (Remix)**: Officially supported
- **Astro**: Officially supported
- **Hono**: Officially supported
- **Vue.js, Nuxt**: Officially supported
- **Svelte (SvelteKit)**: Officially supported
- **Next.js**: @opennextjs/cloudflare reached v1.0-beta

##### 2. Development Tool Improvements
- **Cloudflare Vite Plugin**: Reached v1.0 GA
- **Static Config Files**: Supports `_headers` and `_redirects`
- **Frameworkless Full-Stack Development**: Build complete apps with just Vite and React

##### 3. Database Connection Expansion
- **MySQL Support**: Connect to MySQL databases via Hyperdrive
- **Supported Platforms**: Planetscale, AWS, GCP, Azure, etc.
- **Connection Pooling**: Hyperdrive handles connection pooling and query caching

##### 4. Runtime Enhancements
- **Node.js API Expansion**: Added `crypto`, `tls`, `net`, `dns` modules
- **CPU Time Extension**: Increased from 30 seconds to 5 minutes
- **Environment Variables**: Native support for `process.env`

##### 5. Workers Builds Improvements
- **Build Speed**: Startup latency reduced by 6 seconds
- **GitHub Integration**: Preview URLs for non-production branches
- **API Response**: 7x performance boost via Smart Placement

##### 6. Images API
- **Images binding**: Officially GA
- **Programmable Workflows**: More flexible image processing

#### Architecture Advantages

```javascript
// Full-stack app in a single Worker
export default {
  async fetch(request, env) {
    const pathname = new URL(request.url).pathname;
    
    // API routing
    if (pathname.startsWith('/api/')) {
      return handleAPI(request, env);
    }
    
    // Static asset serving
    // Supports SSR and SPA modes
    return handleStaticAssets(request);
  }
}
```

#### Strategic Significance
- **Unified Platform**: Workers becomes the main development platform, Pages features integrated into Workers
- **Simplified Architecture**: Frontend, backend, and database unified in one Worker
- **Global Deployment**: No need to configure multiple regions, automatic global distribution

#### Related Links
- [Blog Post](https://blog.cloudflare.com/full-stack-development-on-cloudflare-workers/)

---

### [2025-05-29] Workers Builds Error Detection System

**Type**: Platform Reliability Improvement  
**Status**: General Availability  
**Importance**: ⭐⭐⭐

#### Key Features
- **Automatic Error Detection**: Error detection pipeline built with Durable Objects and Queues
- **Historical Analysis**: Retrospective analysis of over 1 million build records
- **Intelligent Classification**: Regex matching and error grouping
- **Proactive Fixes**: Proactively identify and fix issues based on error patterns

#### Technical Architecture
```javascript
// Error detection agent using Durable Objects
export class BuildErrorsAgent extends DurableObject {
  async alarm() {
    // Runs every second, batch processes build errors
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

#### Improvement Results
- **Wrangler Error Messages**: Clearer errors when config files are missing
- **Package Manager Fixes**: Edge cases in TypeScript/JavaScript projects
- **Bun Support**: Added bun.lock support
- **Python Support**: runtime.txt file specifies Python version
- **Build Cache**: Multiple edge cases fixed in monorepos

#### Related Links
- [Blog Post](https://blog.cloudflare.com/detecting-workers-builds-errors-across-1-million-durable-durable-objects/)

---

### [2025-02-25] AI Agents SDK and Workers AI Enhancements

**Type**: AI Platform Expansion  
**Status**: General Availability  
**Importance**: ⭐⭐⭐⭐

#### New Feature Releases

##### 1. agents-sdk Framework
```bash
# Quick start
npm i agents-sdk
# Or use template
npm create cloudflare@latest -- --template cloudflare/agents-starter
```

##### 2. Workers AI Enhancements
- **JSON Mode**: Structured output support
- **Tool Calling**: Enhanced function calling
- **Longer Context Window**: Supports larger input
- **Model Expansion**: Includes Llama 3.1, DeepSeek, etc.

##### 3. workers-ai-provider Updates
- **Tool Calling**: Tool calling for generateText
- **Streaming Support**: Out-of-the-box streaming
- **Usage Statistics**: Usage tracking enabled
- **AI Gateway**: Streaming also supports AI Gateway

#### Technical Highlights
```javascript

```

#### Platform Advantages
- **Pay-per-use**: CPU time billed vs wall-clock time
- **Serverless Inference**: Workers AI billed on-demand
- **Persistent Execution**: Durable Objects and Workflows guarantee execution
- **Global Network**: Low-latency AI inference

#### Related Links
- [Blog Post](https://blog.cloudflare.com/build-ai-agents-on-cloudflare/)

---

## Feature Adoption Suggestions

### High Priority Adoption
1. **Cloudflare Containers** - Suitable for applications requiring specific runtime environments
2. **Full-Stack Workers** - Unified frontend and backend development workflow
3. **AI Agents SDK** - Smart application development

### Medium Priority Adoption
1. **MySQL Hyperdrive** - Existing MySQL applications migration
2. **Images API** - Image processing workflow optimization

### Evaluating Features
1. **Containers Auto-scaling** - Waiting for GA release
2. **Larger Containers Instances** - Waiting for higher limits

---

## Technical Debt Tracking

### Upgrading Items
- [ ] Evaluate existing Pages projects migration to Workers
- [ ] Analyze Containers vs Workers applicability scenarios
- [ ] Plan AI Agent integration strategy

### Experimental Features
- [ ] Test Containers performance in production environment
- [ ] Evaluate AI Agents application in actual business scenarios
- [ ] Explore multi-agent system architecture patterns

---

## Related Resources

### Official Documentation
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Containers Documentation](https://developers.cloudflare.com/containers/)
- [AI Agents Documentation](https://developers.cloudflare.com/agents/)

### Community Resources
- [Cloudflare Discord](https://discord.cloudflare.com/)
- [Workers Examples](https://github.com/cloudflare/workers-examples)

---

*Last Updated: 2025-01-06*  
*Documentation Maintenance: Development Team* 