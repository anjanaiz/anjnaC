import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

// For resolving ESM paths cleanly
const __dirname = path.resolve();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Route - Simple server check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", appName: "Chakra 360 Live Event Production Dashboard" });
  });

  // REST API - Get GitHub synchronized data
  app.get("/api/github/data", (req, res) => {
    const syncDir = path.join(__dirname, "src", "github-repo");
    const markersPath = path.join(syncDir, "markers.json");
    const categoriesPath = path.join(syncDir, "custom_categories.json");
    const commitsPath = path.join(syncDir, "commits.json");

    let markers = null;
    let customCategories = null;
    let commits = [];

    try {
      if (fs.existsSync(markersPath)) {
        markers = JSON.parse(fs.readFileSync(markersPath, "utf8"));
      }
      if (fs.existsSync(categoriesPath)) {
        customCategories = JSON.parse(fs.readFileSync(categoriesPath, "utf8"));
      }
      if (fs.existsSync(commitsPath)) {
        commits = JSON.parse(fs.readFileSync(commitsPath, "utf8"));
      }
      res.json({ success: true, markers, customCategories, commits });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // REST API - Push Sync to GitHub
  app.post("/api/github/sync", (req, res) => {
    const { owner, repoName, branch, markers, customCategories, commitMessage } = req.body;
    
    if (!owner || !repoName) {
      res.status(400).json({ success: false, error: "Repository owner and name are required." });
      return;
    }

    const syncDir = path.join(__dirname, "src", "github-repo");
    const markersPath = path.join(syncDir, "markers.json");
    const categoriesPath = path.join(syncDir, "custom_categories.json");
    const commitsPath = path.join(syncDir, "commits.json");

    try {
      if (!fs.existsSync(syncDir)) {
        fs.mkdirSync(syncDir, { recursive: true });
      }

      // Persist the actual files in our workspace as requested
      if (markers) {
        fs.writeFileSync(markersPath, JSON.stringify(markers, null, 2), "utf8");
      }
      if (customCategories) {
        fs.writeFileSync(categoriesPath, JSON.stringify(customCategories, null, 2), "utf8");
      }

      // Track the mock git commit hash and commit log
      const hash = Math.random().toString(16).substring(2, 8);
      const timestamp = new Date().toLocaleString("en-US", {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
      });

      let commits = [];
      if (fs.existsSync(commitsPath)) {
        try {
          commits = JSON.parse(fs.readFileSync(commitsPath, "utf8"));
        } catch (_) {}
      }

      const defaultMsg = markers 
        ? `Sync ${markers.length} operational stg/stall points with safety circle bounds`
        : "Synchronize repository data";
      
      const newCommit = {
        hash,
        message: commitMessage || defaultMsg,
        timestamp
      };

      commits.unshift(newCommit);
      // Cap at 10 commits max for display
      if (commits.length > 10) {
        commits = commits.slice(0, 10);
      }

      fs.writeFileSync(commitsPath, JSON.stringify(commits, null, 2), "utf8");

      res.json({
        success: true,
        timestamp,
        commitHash: hash,
        commits
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
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
