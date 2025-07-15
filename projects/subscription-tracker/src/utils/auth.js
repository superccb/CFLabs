const CryptoJS = {
    HmacSHA256: function(message, key) {
      const keyData = new TextEncoder().encode(key);
      const messageData = new TextEncoder().encode(message);
      
      return Promise.resolve().then(() => {
        return crypto.subtle.importKey(
          "raw", 
          keyData,
          { name: "HMAC", hash: {name: "SHA-256"} },
          false,
          ["sign"]
        );
      }).then(cryptoKey => {
        return crypto.subtle.sign(
          "HMAC",
          cryptoKey,
          messageData
        );
      }).then(buffer => {
        const hashArray = Array.from(new Uint8Array(buffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      });
    }
};

export function getCookieValue(cookieString, key) {
    if (!cookieString) return null;
    
    const match = cookieString.match(new RegExp('(^| )' + key + '=([^;]+)'));
    return match ? match[2] : null;
}

export async function generateJWT(username, secret) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = { username, iat: Math.floor(Date.now() / 1000) };
    
    const headerBase64 = btoa(JSON.stringify(header));
    const payloadBase64 = btoa(JSON.stringify(payload));
    
    const signatureInput = headerBase64 + '.' + payloadBase64;
    const signature = await CryptoJS.HmacSHA256(signatureInput, secret);
    
    return headerBase64 + '.' + payloadBase64 + '.' + signature;
}

export async function verifyJWT(token, secret) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const [headerBase64, payloadBase64, signature] = parts;
      const signatureInput = headerBase64 + '.' + payloadBase64;
      const expectedSignature = await CryptoJS.HmacSHA256(signatureInput, secret);
      
      if (signature !== expectedSignature) return null;
      
      const payload = JSON.parse(atob(payloadBase64));
      return payload;
    } catch (error) {
      return null;
    }
} 