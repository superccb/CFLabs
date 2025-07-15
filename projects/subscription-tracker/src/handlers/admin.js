import { getCookieValue, verifyJWT } from '../utils/auth.js';
import { getConfig } from '../utils/kv.js';
import { adminPage } from '../templates/admin.js';
import { configPage } from '../templates/config.js';

export const adminHandler = {
  async handleRequest(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    const token = getCookieValue(request.headers.get('Cookie'), 'token');
    const config = await getConfig(env);
    const user = token ? await verifyJWT(token, config.JWT_SECRET) : null;
    
    if (!user) {
      return new Response('', {
        status: 302,
        headers: { 'Location': '/' }
      });
    }
    
    if (pathname === '/admin/config') {
      return new Response(configPage, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    
    return new Response(adminPage, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}; 