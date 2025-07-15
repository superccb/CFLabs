import { getConfig } from '../utils/kv.js';
import { generateJWT } from '../utils/auth.js';

export async function handleAuthRequest(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.slice(5); // Remove /api/
    const method = request.method;
    const config = await getConfig(env);

    if (path === 'login' && method === 'POST') {
        const body = await request.json();
        
        if (body.username === config.ADMIN_USERNAME && body.password === config.ADMIN_PASSWORD) {
          const token = await generateJWT(body.username, config.JWT_SECRET);
          
          return new Response(
            JSON.stringify({ success: true }),
            {
              headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': `token=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400`
              }
            }
          );
        } else {
          return new Response(
            JSON.stringify({ success: false, message: '用户名或密码错误' }),
            { headers: { 'Content-Type': 'application/json' }, status: 401 }
          );
        }
    }

    if (path === 'logout') {
        return new Response('', {
          status: 302,
          headers: {
            'Location': '/',
            'Set-Cookie': 'token=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0'
          }
        });
    }

    return new Response(JSON.stringify({ success: false, message: 'Not Found' }), { status: 404 });
} 