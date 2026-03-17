import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import dns from "dns";
import { promisify } from "util";

const resolveCname = promisify(dns.resolveCname);

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API PROXIES ---

  // Exa Search Proxy
  app.post("/api/search/exa", async (req, res) => {
    const apiKey = process.env.EXA_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "EXA_API_KEY not configured" });

    try {
      const response = await fetch("https://api.exa.ai/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Tavily Search Proxy
  app.post("/api/search/tavily", async (req, res) => {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "TAVILY_API_KEY not configured" });

    try {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...req.body, api_key: apiKey }),
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Firecrawl Search Proxy
  app.post("/api/search/firecrawl", async (req, res) => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "FIRECRAWL_API_KEY not configured" });

    try {
      const response = await fetch("https://api.firecrawl.dev/v0/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Groq Proxy (for streaming)
  app.post("/api/chat/groq", async (req, res) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GROQ_API_KEY not configured" });

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({ ...req.body, stream: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return res.status(response.status).json(errorData);
      }

      // Stream the response back to the client
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // OpenRouter Proxy
  app.post("/api/chat/openrouter", async (req, res) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "OPENROUTER_API_KEY not configured" });

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://impersio.me",
          "X-Title": "Impersio"
        },
        body: JSON.stringify({ ...req.body, stream: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return res.status(response.status).json(errorData);
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Pollinations Proxy
  app.post("/api/chat/pollinations", async (req, res) => {
    try {
      const response = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...req.body, stream: true }),
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: response.statusText });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Supadata Proxy
  app.get("/api/search/supadata", async (req, res) => {
    const apiKey = process.env.SUPADATA_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "SUPADATA_API_KEY not configured" });

    const { query } = req.query;
    try {
      const response = await fetch(`https://api.supadata.ai/v1/youtube/search?query=${encodeURIComponent(query as string)}`, {
        headers: { "x-api-key": apiKey }
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Valyu Proxy
  app.post("/api/search/valyu", async (req, res) => {
    const apiKey = process.env.VALYU_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "VALYU_API_KEY not configured" });

    try {
      const response = await fetch("https://api.valyu.ai/v1/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // DNS Verification Proxy
  app.get("/api/dns/verify", async (req, res) => {
    const { domain, expected } = req.query;
    if (!domain || !expected) return res.status(400).json({ error: "Missing domain or expected value" });

    try {
      const records = await resolveCname(domain as string);
      const isVerified = records.some(r => r.toLowerCase() === (expected as string).toLowerCase());
      res.json({ verified: isVerified, records });
    } catch (error: any) {
      // If record not found, it's not verified
      res.json({ verified: false, error: error.code === 'ENODATA' || error.code === 'ENOTFOUND' ? "Record not found" : error.message });
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
