import { apiHandler } from './api/index.js';
import { adminHandler } from './handlers/admin.js';
import { scheduledHandler } from './handlers/scheduled.js';
import { loginPage } from './templates/login.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname.startsWith('/api/')) {
      return apiHandler.handleRequest(request, env);
    } 
    
    if (url.pathname.startsWith('/admin')) {
      return adminHandler.handleRequest(request, env);
    }
    
    // Serve login page for the root path
    if (url.pathname === '/') {
        return new Response(loginPage, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
    }

    return new Response('Not Found', { status: 404 });
  },
  
  async scheduled(event, env, ctx) {
    return scheduledHandler.scheduled(event, env, ctx);
  }
}; 