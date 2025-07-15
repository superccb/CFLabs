export async function getConfig(env) {
    try {
      const data = await env.SUBSCRIPTIONS_KV.get('config');
      const config = data ? JSON.parse(data) : {};
      
      return {
        ADMIN_USERNAME: config.ADMIN_USERNAME || 'admin',
        ADMIN_PASSWORD: config.ADMIN_PASSWORD || 'password',
        JWT_SECRET: config.JWT_SECRET || 'your-secret-key',
        TG_BOT_TOKEN: config.TG_BOT_TOKEN || '',
        TG_CHAT_ID: config.TG_CHAT_ID || '',
        NOTIFYX_API_KEY: config.NOTIFYX_API_KEY || '',
        NOTIFICATION_TYPE: config.NOTIFICATION_TYPE || 'notifyx'
      };
    } catch (error) {
      return {
        ADMIN_USERNAME: 'admin',
        ADMIN_PASSWORD: 'password',
        JWT_SECRET: 'your-secret-key',
        TG_BOT_TOKEN: '',
        TG_CHAT_ID: '',
        NOTIFYX_API_KEY: '',
        NOTIFICATION_TYPE: 'notifyx'
      };
    }
}

export async function getAllSubscriptions(env) {
    try {
      const data = await env.SUBSCRIPTIONS_KV.get('subscriptions');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
}
  
export async function getSubscription(id, env) {
    const subscriptions = await getAllSubscriptions(env);
    return subscriptions.find(s => s.id === id);
}
  
export async function createSubscription(subscription, env) {
    try {
      const subscriptions = await getAllSubscriptions(env);
      
      if (!subscription.name || !subscription.expiryDate) {
        return { success: false, message: '缺少必填字段' };
      }
      
      let expiryDate = new Date(subscription.expiryDate);
      const now = new Date();
      
      if (expiryDate < now && subscription.periodValue && subscription.periodUnit) {
        while (expiryDate < now) {
          if (subscription.periodUnit === 'day') {
            expiryDate.setDate(expiryDate.getDate() + subscription.periodValue);
          } else if (subscription.periodUnit === 'month') {
            expiryDate.setMonth(expiryDate.getMonth() + subscription.periodValue);
          } else if (subscription.periodUnit === 'year') {
            expiryDate.setFullYear(expiryDate.getFullYear() + subscription.periodValue);
          }
        }
        subscription.expiryDate = expiryDate.toISOString();
      }
      
      const newSubscription = {
        id: Date.now().toString(),
        name: subscription.name,
        customType: subscription.customType || '',
        startDate: subscription.startDate || null,
        expiryDate: subscription.expiryDate,
        periodValue: subscription.periodValue || 1,
        periodUnit: subscription.periodUnit || 'month',
        reminderDays: subscription.reminderDays !== undefined ? subscription.reminderDays : 7,
        notes: subscription.notes || '',
        isActive: subscription.isActive !== false,
        autoRenew: subscription.autoRenew !== false,
        createdAt: new Date().toISOString()
      };
      
      subscriptions.push(newSubscription);
      
      await env.SUBSCRIPTIONS_KV.put('subscriptions', JSON.stringify(subscriptions));
      
      return { success: true, subscription: newSubscription };
    } catch (error) {
      return { success: false, message: '创建订阅失败' };
    }
}
  
export async function updateSubscription(id, subscription, env) {
    try {
      const subscriptions = await getAllSubscriptions(env);
      const index = subscriptions.findIndex(s => s.id === id);
      
      if (index === -1) {
        return { success: false, message: '订阅不存在' };
      }
      
      if (!subscription.name || !subscription.expiryDate) {
        return { success: false, message: '缺少必填字段' };
      }
      
      let expiryDate = new Date(subscription.expiryDate);
      const now = new Date();
      
      if (expiryDate < now && subscription.periodValue && subscription.periodUnit) {
        while (expiryDate < now) {
          if (subscription.periodUnit === 'day') {
            expiryDate.setDate(expiryDate.getDate() + subscription.periodValue);
          } else if (subscription.periodUnit === 'month') {
            expiryDate.setMonth(expiryDate.getMonth() + subscription.periodValue);
          } else if (subscription.periodUnit === 'year') {
            expiryDate.setFullYear(expiryDate.getFullYear() + subscription.periodValue);
          }
        }
        subscription.expiryDate = expiryDate.toISOString();
      }
      
      subscriptions[index] = {
        ...subscriptions[index],
        name: subscription.name,
        customType: subscription.customType || subscriptions[index].customType || '',
        startDate: subscription.startDate || subscriptions[index].startDate,
        expiryDate: subscription.expiryDate,
        periodValue: subscription.periodValue || subscriptions[index].periodValue || 1,
        periodUnit: subscription.periodUnit || subscriptions[index].periodUnit || 'month',
        reminderDays: subscription.reminderDays !== undefined ? subscription.reminderDays : (subscriptions[index].reminderDays !== undefined ? subscriptions[index].reminderDays : 7),
        notes: subscription.notes || '',
        isActive: subscription.isActive !== undefined ? subscription.isActive : subscriptions[index].isActive,
        autoRenew: subscription.autoRenew !== undefined ? subscription.autoRenew : (subscriptions[index].autoRenew !== undefined ? subscriptions[index].autoRenew : true),
        updatedAt: new Date().toISOString()
      };
      
      await env.SUBSCRIPTIONS_KV.put('subscriptions', JSON.stringify(subscriptions));
      
      return { success: true, subscription: subscriptions[index] };
    } catch (error) {
      return { success: false, message: '更新订阅失败' };
    }
}
  
export async function deleteSubscription(id, env) {
    try {
      const subscriptions = await getAllSubscriptions(env);
      const filteredSubscriptions = subscriptions.filter(s => s.id !== id);
      
      if (filteredSubscriptions.length === subscriptions.length) {
        return { success: false, message: '订阅不存在' };
      }
      
      await env.SUBSCRIPTIONS_KV.put('subscriptions', JSON.stringify(filteredSubscriptions));
      
      return { success: true };
    } catch (error) {
      return { success: false, message: '删除订阅失败' };
    }
}
  
export async function toggleSubscriptionStatus(id, isActive, env) {
    try {
      const subscriptions = await getAllSubscriptions(env);
      const index = subscriptions.findIndex(s => s.id === id);
      
      if (index === -1) {
        return { success: false, message: '订阅不存在' };
      }
      
      subscriptions[index] = {
        ...subscriptions[index],
        isActive: isActive,
        updatedAt: new Date().toISOString()
      };
      
      await env.SUBSCRIPTIONS_KV.put('subscriptions', JSON.stringify(subscriptions));
      
      return { success: true, subscription: subscriptions[index] };
    } catch (error) {
      return { success: false, message: '更新订阅状态失败' };
    }
} 