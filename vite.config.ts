import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";

// =============================================================================
// Debug Collector - Vite Plugin
// Development-only browser debug logging.
// =============================================================================

const PROJECT_ROOT = import.meta.dirname;
const LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
const MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
const TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);

type LogSource = "browserConsole" | "networkRequests" | "sessionReplay";

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}

function trimLogFile(logPath: string) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= MAX_LOG_SIZE_BYTES) return;
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines: string[] = [];
    let keptBytes = 0;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}\n`, "utf-8");
      if (keptBytes + lineBytes > TRIM_TARGET_BYTES) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
    // Debug logging must never affect the app.
  }
}

function writeToLogFile(source: LogSource, entries: unknown[]) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => `[${new Date().toISOString()}] ${JSON.stringify(entry)}`);
  fs.appendFileSync(logPath, `${lines.join("\n")}\n`, "utf-8");
  trimLogFile(logPath);
}

function vitePluginDebugCollector(): Plugin {
  return {
    name: "debug-collector",
    apply: "serve",
    transformIndexHtml(html) {
      return {
        html,
        tags: [{
          tag: "script",
          attrs: { src: "/__manus__/debug-collector.js", defer: true },
          injectTo: "head",
        }],
      };
    },
    configureServer(server: ViteDevServer) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") return next();
        let body = "";
        req.on("data", (chunk) => { body += chunk.toString(); });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            writeToLogFile("browserConsole", payload.consoleLogs ?? []);
            writeToLogFile("networkRequests", payload.networkRequests ?? []);
            writeToLogFile("sessionReplay", payload.sessionEvents ?? []);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true }));
          } catch (error) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(error) }));
          }
        });
      });
    },
  };
}

const plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginDebugCollector()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
