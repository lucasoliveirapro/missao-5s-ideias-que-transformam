import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

function assetMiddleware(command) {
  const assetsRoot = path.resolve(rootDir, "assets");
  const contentTypes = {
    ".svg": "image/svg+xml; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".mp3": "audio/mpeg"
  };

  return {
    name: "missao-5s-assets",
    configureServer(server) {
      server.middlewares.use("/assets", (req, res, next) => {
        const urlPath = decodeURIComponent((req.url || "").split("?")[0]);
        const targetPath = path.resolve(assetsRoot, `.${urlPath}`);

        if (!targetPath.startsWith(assetsRoot)) {
          res.statusCode = 403;
          res.end("Forbidden");
          return;
        }

        if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
          const stat = fs.statSync(targetPath);
          res.setHeader("Content-Type", contentTypes[path.extname(targetPath).toLowerCase()] || "application/octet-stream");
          res.setHeader("Content-Length", String(stat.size));
          if (req.method === "HEAD") {
            res.end();
            return;
          }
          fs.createReadStream(targetPath).pipe(res);
          return;
        }

        next();
      });
    },
    closeBundle() {
      if (command !== "build" || !fs.existsSync(assetsRoot)) {
        return;
      }

      fs.cpSync(assetsRoot, path.resolve(rootDir, "dist", "assets"), { recursive: true });
    }
  };
}

export default defineConfig(({ command }) => ({
  plugins: [assetMiddleware(command)],
  build: {
    rollupOptions: {
      input: {
        app: path.resolve(rootDir, "index.html"),
        admin: path.resolve(rootDir, "admin.html")
      }
    }
  }
}));
