import { sendNotification } from "../utils/notifications.js";
import { getConfig } from "../utils/kv.js";

export async function handleNotificationRequest(request, env) {
    const method = request.method;

    if (method === 'POST') {
        try {
          const body = await request.json();
          let success = false;
          let message = '';
          const config = await getConfig(env);
          
          if (body.type === 'telegram') {
            const testConfig = {
              ...config,
              TG_BOT_TOKEN: body.TG_BOT_TOKEN,
              TG_CHAT_ID: body.TG_CHAT_ID,
              NOTIFICATION_TYPE: 'telegram'
            };
            
            const content = '*测试通知*\n\n这是一条测试通知，用于验证Telegram通知功能是否正常工作。\n\n发送时间: ' + new Date().toLocaleString();
            success = await sendNotification('测试通知', content, 'Telegram 测试', testConfig);
            message = success ? 'Telegram通知发送成功' : 'Telegram通知发送失败，请检查配置';

          } else if (body.type === 'notifyx') {
            const testConfig = {
              ...config,
              NOTIFYX_API_KEY: body.NOTIFYX_API_KEY,
              NOTIFICATION_TYPE: 'notifyx'
            };
            
            const title = '测试通知';
            const content = '## 这是一条测试通知\n\n用于验证NotifyX通知功能是否正常工作。\n\n发送时间: ' + new Date().toLocaleString();
            const description = '测试NotifyX通知功能';
            
            success = await sendNotification(title, content, description, testConfig);
            message = success ? 'NotifyX通知发送成功' : 'NotifyX通知发送失败，请检查配置';
          }
          
          return new Response(
            JSON.stringify({ success, message }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('测试通知失败:', error);
          return new Response(
            JSON.stringify({ success: false, message: '测试通知失败: ' + error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
    }

    return new Response(JSON.stringify({ success: false, message: 'Method Not Allowed' }), { status: 405 });
} 