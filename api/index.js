// api/index.js
// Proxy sederhana: semua request yang masuk lewat domain Vercel
// akan diteruskan (proxy) ke server asli, lalu hasilnya dikirim
// balik ke pengunjung — jadi dari luar cuma kelihatan domain Vercel.

export const config = {
  api: {
    bodyParser: false, // biar body request diteruskan mentah, tanpa diubah
  },
};

// Ganti ini dengan domain server asli kamu (tanpa slash di akhir)
const TARGET = process.env.PROXY_TARGET || 'https://domain-asli-kamu.com';

// Header yang tidak boleh ikut diteruskan (biar tidak konflik)
const HOP_BY_HOP = ['host', 'connection', 'content-length', 'transfer-encoding'];

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  try {
    const targetUrl = TARGET + req.url; // req.url sudah termasuk path + query string

    // Salin header dari request asli, kecuali yang hop-by-hop
    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (!HOP_BY_HOP.includes(key.toLowerCase())) headers[key] = value;
    }

    // Ambil body mentah kalau method bukan GET/HEAD
    let body;
    if (!['GET', 'HEAD'].includes(req.method)) {
      body = await getRawBody(req);
    }

    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: 'manual', // biar redirect dari server asli tidak "membocorkan" domain asli ke browser
    });

    // Teruskan header dari server asli ke response, kecuali yang bermasalah kalau diteruskan
    upstream.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      if (['content-encoding', 'transfer-encoding', 'content-length'].includes(k)) return;
      res.setHeader(key, value);
    });

    res.statusCode = upstream.status;

    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.end(buffer);
  } catch (err) {
    res.statusCode = 502;
    res.end('Proxy error: ' + err.message);
  }
}
