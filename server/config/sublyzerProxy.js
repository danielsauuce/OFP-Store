const TARGET = (
  process.env.SUBLYZER_PROXY_TARGET || 'https://sublyzer-backend-production.up.railway.app'
).replace(/\/+$/, '');

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

    const r = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      body,
    });

    const text = await r.text();

    res.status(r.status);
    const ct = r.headers.get('content-type');
    if (ct) res.setHeader('content-type', ct);

    return res.send(text);
  } catch (e) {
    return res.status(502).json({
      ok: false,
      error: {
        message: 'Sublyzer proxy failed',
        detail: String(e?.message || e),
      },
    });
  }
}
