import { getConfig } from '../utils/kv.js';

export async function handleConfigRequest(request, env) {
    const method = request.method;
    const config = await getConfig(env);

    if (method === 'GET') {
        const { JWT_SECRET, ADMIN_PASSWORD, ...safeConfig } = config;
        return new Response(
          JSON.stringify(safeConfig),
          { headers: { 'Content-Type': 'application/json' } }
        );
    }
      
    if (method === 'POST') {
        try {
          const newConfig = await request.json();
          
          const updatedConfig = { 
            ...config,
            ADMIN_USERNAME: newConfig.ADMIN_USERNAME || config.ADMIN_USERNAME,
            TG_BOT_TOKEN: newConfig.TG_BOT_TOKEN || '',
            TG_CHAT_ID: newConfig.TG_CHAT_ID || '',
            NOTIFYX_API_KEY: newConfig.NOTIFYX_API_KEY || '',
            NOTIFICATION_TYPE: newConfig.NOTIFICATION_TYPE || config.NOTIFICATION_TYPE
          };
          
          if (newConfig.ADMIN_PASSWORD) {
            updatedConfig.ADMIN_PASSWORD = newConfig.ADMIN_PASSWORD;
          }
          
          await env.SUBSCRIPTIONS_KV.put('config', JSON.stringify(updatedConfig));
          
          return new Response(
            JSON.stringify({ success: true }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ success: false, message: '更新配置失败' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
    }

    return new Response(JSON.stringify({ success: false, message: 'Method Not Allowed' }), { status: 405 });
} 