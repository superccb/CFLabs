import api from './api.js';
import admin from './admin.js';
// import { renderSiteCard, getRandomSVG, fallbackSVGIcons } from './views.js';

async function handleRequest(request, env, ctx) {
  // ...（原 worker.js handleRequest 實現，必要時引用 views）...
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api')) {
      return api.handleRequest(request, env, ctx);
    } else if (url.pathname === '/admin' || url.pathname.startsWith('/static')) {
      return admin.handleRequest(request, env, ctx);
    } else {
      return handleRequest(request, env, ctx);
    }
  }
}; 