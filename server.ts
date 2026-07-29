import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import rateLimit from "express-rate-limit";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable JSON body parsing
  app.use(express.json());

  // Configure express-rate-limit middleware for /api/chat
  const chatRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15-minute sliding window
    max: 30, // Limit each IP to 30 requests per 15-minute window
    standardHeaders: true, // Return rate limit info in standard `RateLimit-*` headers
    legacyHeaders: false, // Disable legacy `X-RateLimit-*` headers
    message: {
      status: 429,
      error: "Too Many Requests",
      message: "Rate limit exceeded for /api/chat (30 requests per 15 minutes). Please wait before making additional API calls to avoid API quota abuse."
    }
  });

  // Health check API endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      server: "Express",
      rateLimiting: "active",
      endpoint: "/api/chat",
      windowMinutes: 15,
      maxRequestsPerWindow: 30
    });
  });

  // /api/chat route protected with express-rate-limit middleware
  app.post("/api/chat", chatRateLimiter, async (req, res) => {
    try {
      const { prompt, mode, model, temperature, systemInstruction } = req.body || {};

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ 
          error: "Bad Request", 
          message: "A valid non-empty 'prompt' string parameter is required in the request body." 
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ 
          error: "Server Error", 
          message: "GEMINI_API_KEY is not configured on the server environment." 
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const targetModel = model || "gemini-3.6-flash";

      const fullPrompt = systemInstruction 
        ? `${systemInstruction}\n\nUser Request: ${prompt}`
        : prompt;

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: fullPrompt,
        config: {
          temperature: typeof temperature === 'number' ? temperature : 0.7,
        }
      });

      return res.json({
        success: true,
        text: response.text,
        model: targetModel,
        mode: mode || "chat",
        usage: response.usageMetadata || null
      });

    } catch (err: any) {
      console.error("[Server] Error in /api/chat route:", err);
      return res.status(500).json({
        error: "Internal Server Error",
        message: err?.message || "An error occurred while generating content via /api/chat."
      });
    }
  });

  // Vite development middleware or static production fallback
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Express full-stack server running on http://0.0.0.0:${PORT}`);
    console.log(`[Server] Express rate-limiter active on POST /api/chat (30 req / 15 min)`);
  });
}

startServer().catch((err) => {
  console.error("[Server] Critical startup failure:", err);
  process.exit(1);
});
