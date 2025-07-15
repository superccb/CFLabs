import { handleAuthRequest } from './auth.js';
import { handleConfigRequest } from './config.js';
import { handleSubscriptionsRequest } from './subscriptions.js';
import { handleNotificationRequest } from './notifications.js';
import { getCookieValue, verifyJWT } from '../utils/auth.js';
import { getConfig } from '../utils/kv.js';

export const apiHandler = {
  async handleRequest(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.slice(5); // Remove /api/
    
    // Auth endpoints are public
    if (path === 'login' || path === 'logout') {
        return handleAuthRequest(request, env);
    }

    // Authenticate all other API requests
    const config = await getConfig(env);
    const token = getCookieValue(request.headers.get('Cookie'), 'token');
    const user = token ? await verifyJWT(token, config.JWT_SECRET) : null;
    
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: '未授权访问' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Route to the correct handler
    if (path.startsWith('subscriptions')) {
        return handleSubscriptionsRequest(request, env);
    }
    if (path.startsWith('config')) {
        return handleConfigRequest(request, env);
    }
    if (path.startsWith('test-notification')) {
        return handleNotificationRequest(request, env);
    }
    
    return new Response(
      JSON.stringify({ success: false, message: '未找到请求的资源' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }
}; 