import { getSubscription, getConfig } from "./kv.js";

async function sendTelegramNotification(message, config) {
    try {
      if (!config.TG_BOT_TOKEN || !config.TG_CHAT_ID) {
        console.error('[Telegram] 通知未配置，缺少Bot Token或Chat ID');
        return false;
      }
      
      console.log('[Telegram] 开始发送通知到 Chat ID: ' + config.TG_CHAT_ID);
      
      const url = 'https://api.telegram.org/bot' + config.TG_BOT_TOKEN + '/sendMessage';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: config.TG_CHAT_ID,
          text: message,
          parse_mode: 'Markdown'
        })
      });
      
      const result = await response.json();
      console.log('[Telegram] 发送结果:', result);
      return result.ok;
    } catch (error) {
      console.error('[Telegram] 发送通知失败:', error);
      return false;
    }
}
  
async function sendNotifyXNotification(title, content, description, config) {
    try {
      if (!config.NOTIFYX_API_KEY) {
        console.error('[NotifyX] 通知未配置，缺少API Key');
        return false;
      }
      
      console.log('[NotifyX] 开始发送通知: ' + title);
      
      const url = 'https://www.notifyx.cn/api/v1/send/' + config.NOTIFYX_API_KEY;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title,
          content: content,
          description: description || ''
        })
      });
      
      const result = await response.json();
      console.log('[NotifyX] 发送结果:', result);
      return result.status === 'queued';
    } catch (error) {
      console.error('[NotifyX] 发送通知失败:', error);
      return false;
    }
}

export async function sendNotification(title, content, description, config) {
    if (config.NOTIFICATION_TYPE === 'notifyx') {
      return await sendNotifyXNotification(title, content, description, config);
    } else {
      return await sendTelegramNotification(content, config);
    }
}

export async function testSingleSubscriptionNotification(id, env) {
    try {
      const subscription = await getSubscription(id, env);
      if (!subscription) {
        return { success: false, message: '未找到该订阅' };
      }
      const config = await getConfig(env);
  
      const title = `手动测试通知: ${subscription.name}`;
      const description = `这是一个对订阅 "${subscription.name}" 的手动测试通知。`;
      let content = '';
  
      // 根据所选通知渠道格式化消息内容，与主提醒功能保持一致
      if (config.NOTIFICATION_TYPE === 'notifyx') {
          content = `## ${title}\n\n**订阅详情**:\n- **类型**: ${subscription.customType || '其他'}\n- **到期日**: ${new Date(subscription.expiryDate).toLocaleDateString()}\n- **备注**: ${subscription.notes || '无'}`;
      } else { // 默认 Telegram
          content = `*${title}*\n\n**订阅详情**:\n- **类型**: ${subscription.customType || '其他'}\n- **到期日**: ${new Date(subscription.expiryDate).toLocaleDateString()}\n- **备注**: ${subscription.notes || '无'}`;
      }
  
      const success = await sendNotification(title, content, description, config);
  
      if (success) {
          return { success: true, message: '测试通知已成功发送' };
      } else {
          return { success: false, message: '测试通知发送失败，请检查配置' };
      }
  
    } catch (error) {
      console.error('[手动测试] 发送失败:', error);
      return { success: false, message: '发送时发生错误: ' + error.message };
    }
}
  
async function sendWeComNotification(message, config) {
    // This is a placeholder. In a real scenario, you would implement the WeCom notification logic here.
    console.log("[企业微信] 通知功能未实现");
    return { success: false, message: "企业微信通知功能未实现" };
}
  
export async function sendNotificationToAllChannels(title, commonContent, config, logPrefix = '[定时任务]') {
    if (!config.ENABLED_NOTIFIERS || config.ENABLED_NOTIFIERS.length === 0) {
        console.log(`${logPrefix} 未启用任何通知渠道。`);
        return;
    }

    if (config.ENABLED_NOTIFIERS.includes('notifyx')) {
        const notifyxContent = `## ${title}\n\n${commonContent}`;
        const success = await sendNotifyXNotification(title, notifyxContent, `订阅提醒`, config);
        console.log(`${logPrefix} 发送NotifyX通知 ${success ? '成功' : '失败'}`);
    }
    if (config.ENABLED_NOTIFIERS.includes('telegram')) {
        const telegramContent = `*${title}*\n\n${commonContent.replace(/(\s)/g, ' ')}`;
        const success = await sendTelegramNotification(telegramContent, config);
        console.log(`${logPrefix} 发送Telegram通知 ${success ? '成功' : '失败'}`);
    }
    if (config.ENABLED_NOTIFIERS.includes('weixin')) {
        const weixinContent = `【${title}】\n\n${commonContent.replace(/(\**|\*|##|#|`)/g, '')}`;
        const result = await sendWeComNotification(weixinContent, config);
        console.log(`${logPrefix} 发送企业微信通知 ${result.success ? '成功' : '失败'}. ${result.message}`);
    }
} 