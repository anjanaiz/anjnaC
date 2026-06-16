import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

// For resolving ESM paths cleanly
const __dirname = path.resolve();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route - Simple server check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", appName: "Chakra 360 Live Event Production Dashboard" });
  });

  // Vite dev server or static server configuration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
