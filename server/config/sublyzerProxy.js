const TARGET = (
  process.env.SUBLYZER_PROXY_TARGET || 'https://sublyzer-backend-production.up.railway.app'
).replace(/\/+$/, '');

const TIMEOUT_MS = 10000; // 10 second timeout

export async function sublyzerProxy(req, res) {
  if (req.method === 'OPTIONS') return res.sendStatus(204);

  const upstreamUrl = TARGET + req.originalUrl.replace(/^\/sublyzer/, '');

  try {
    const headers = {
      'content-type': 'application/json',
      'user-agent': req.headers['user-agent'] || 'sublyzer-proxy',
      accept: req.headers['accept'] || 'application/json',
    };

    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
    const body = hasBody ? JSON.stringify(req.body ?? {}) : undefined;

    // Add AbortController timeout to prevent indefinite hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const r = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const text = await r.text();

    res.status(r.status);
    const ct = r.headers.get('content-type');
    if (ct) res.setHeader('content-type', ct);

    return res.send(text);
  } catch (e) {
    const isTimeout = e?.name === 'AbortError';
    return res.status(isTimeout ? 504 : 502).json({
      ok: false,
      error: {
        message: isTimeout ? 'Sublyzer proxy timed out' : 'Sublyzer proxy failed',
        detail: String(e?.message || e),
      },
    });
  }
}
