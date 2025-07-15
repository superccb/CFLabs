import { 
    getAllSubscriptions,
    createSubscription,
    getSubscription,
    updateSubscription,
    deleteSubscription,
    toggleSubscriptionStatus
} from '../utils/kv.js';
import { testSingleSubscriptionNotification } from '../utils/notifications.js';

export async function handleSubscriptionsRequest(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname.slice(5); // remove /api/
    
    //  /subscriptions
    if (path === 'subscriptions') {
        if (method === 'GET') {
            const subscriptions = await getAllSubscriptions(env);
            return new Response(
              JSON.stringify(subscriptions),
              { headers: { 'Content-Type': 'application/json' } }
            );
        }
        
        if (method === 'POST') {
            const subscription = await request.json();
            const result = await createSubscription(subscription, env);
            
            return new Response(
              JSON.stringify(result),
              { 
                status: result.success ? 201 : 400, 
                headers: { 'Content-Type': 'application/json' } 
              }
            );
        }
    }

    // /subscriptions/:id/*
    if (path.startsWith('subscriptions/')) {
        const parts = path.split('/');
        const id = parts[1];

        if (parts[2]) { // Handle /subscriptions/:id/action
            if (parts[2] === 'toggle-status' && method === 'POST') {
                const body = await request.json();
                const result = await toggleSubscriptionStatus(id, body.isActive, env);
                
                return new Response(
                  JSON.stringify(result),
                  { 
                    status: result.success ? 200 : 400, 
                    headers: { 'Content-Type': 'application/json' } 
                  }
                );
            }
        
            if (parts[2] === 'test-notify' && method === 'POST') {
                const result = await testSingleSubscriptionNotification(id, env);
                return new Response(JSON.stringify(result), { status: result.success ? 200 : 500, headers: { 'Content-Type': 'application/json' } });
            }
        } else { // Handle /subscriptions/:id
            if (method === 'GET') {
                const subscription = await getSubscription(id, env);
                return new Response(
                  JSON.stringify(subscription),
                  { headers: { 'Content-Type': 'application/json' } }
                );
            }
            
            if (method === 'PUT') {
                const subscription = await request.json();
                const result = await updateSubscription(id, subscription, env);
                
                return new Response(
                  JSON.stringify(result),
                  { 
                    status: result.success ? 200 : 400, 
                    headers: { 'Content-Type': 'application/json' } 
                  }
                );
            }
            
            if (method === 'DELETE') {
                const result = await deleteSubscription(id, env);
                
                return new Response(
                  JSON.stringify(result),
                  { 
                    status: result.success ? 200 : 400, 
                    headers: { 'Content-Type': 'application/json' } 
                  }
                );
            }
        }
    }

    return new Response(JSON.stringify({ success: false, message: 'Not Found' }), { status: 404 });
} 