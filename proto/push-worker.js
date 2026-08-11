/* push-proto — minimal Web Push sender for the iOS notification prototype.
   Deploy as its own Cloudflare Worker named "push-proto".
   REQUIRED: one KV namespace binding named PUSHKV (Settings → Bindings → KV).
   Nothing else. VAPID keys self-generate on first request and live in KV.
   The push carries NO payload — no encryption needed; the service worker
   shows a fixed notification. This is the bare minimum pipeline. */

const SUBJECT = 'mailto:proto@example.com';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function j(o, s = 200) {
  return new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json', ...CORS } });
}
function b64u(buf) {
  let s = btoa(String.fromCharCode(...new Uint8Array(buf)));
  return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64uToBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const b = atob(s), a = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
  return a;
}

async function getKeys(env) {
  let pub = await env.PUSHKV.get('vapid_pub');
  let priv = await env.PUSHKV.get('vapid_priv');
  if (pub && priv) return { pub, priv };
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']);
  pub = b64u(await crypto.subtle.exportKey('raw', kp.publicKey));
  priv = b64u(await crypto.subtle.exportKey('pkcs8', kp.privateKey));
  await env.PUSHKV.put('vapid_pub', pub);
  await env.PUSHKV.put('vapid_priv', priv);
  return { pub, priv };
}

async function vapidAuth(env, endpoint) {
  const { pub, priv } = await getKeys(env);
  const aud = new URL(endpoint).origin;
  const enc = new TextEncoder();
  const hdr = b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const pay = b64u(enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: SUBJECT })));
  const key = await crypto.subtle.importKey('pkcs8', b64uToBytes(priv), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(hdr + '.' + pay));
  return 'vapid t=' + hdr + '.' + pay + '.' + b64u(sig) + ', k=' + pub;
}

export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

    if (u.pathname === '/key') {
      const { pub } = await getKeys(env);
      return j({ key: pub });
    }

    if (u.pathname === '/sub' && req.method === 'POST') {
      const b = await req.json().catch(() => null);
      if (!b || !b.code || !b.subscription) return j({ err: 'code and subscription required' }, 400);
      await env.PUSHKV.put('sub:' + b.code.toUpperCase(), JSON.stringify(b.subscription));
      return j({ ok: true });
    }

    if (u.pathname === '/send' && req.method === 'POST') {
      const b = await req.json().catch(() => null);
      if (!b || !b.code) return j({ err: 'code required' }, 400);
      const s = await env.PUSHKV.get('sub:' + b.code.toUpperCase());
      if (!s) return j({ err: 'no subscription stored for code ' + b.code }, 404);
      const sub = JSON.parse(s);
      const auth = await vapidAuth(env, sub.endpoint);
      const r = await fetch(sub.endpoint, {
        method: 'POST',
        headers: { 'Authorization': auth, 'TTL': '60', 'Urgency': 'high' }
      });
      const body = await r.text().catch(() => '');
      return j({ pushServiceStatus: r.status, ok: r.status === 200 || r.status === 201, detail: body.slice(0, 300) });
    }

    return j({ err: 'not found' }, 404);
  }
};
