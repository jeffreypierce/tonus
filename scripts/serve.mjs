#!/usr/bin/env node
// ---------------------------------------------------------------------------
// serve.mjs — the site, over http, because file:// cannot run it
// ---------------------------------------------------------------------------
// The page is ES modules all the way down. A browser treats every file:// URL
// as its own origin, so an `import` from one file to the next is a cross-origin
// request and is refused — the site opens to a blank page and a CORS error that
// has nothing to do with the site. (VS Code's preview appears to work because
// it quietly serves over http.)
//
// So: a static server over docs/, which is also exactly what GitHub Pages
// does. If it runs here it runs there.
//
//   npm run serve            → http://localhost:8000
//   npm run serve -- 4000    → another port
//
// No dependency: node ships everything this needs.

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "docs");
const PORT = Number(process.argv[2]) || Number(process.env.PORT) || 8000;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    // Normalize before joining: a path may not climb out of docs/.
    const rel = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
    let file = join(ROOT, rel);
    if (!file.startsWith(ROOT + sep) && file !== ROOT) {
      res.writeHead(403).end("outside the site");
      return;
    }

    let info = await stat(file).catch(() => null);
    if (info?.isDirectory()) {
      file = join(file, "index.html");
      info = await stat(file).catch(() => null);
    }
    if (!info) {
      res.writeHead(404, { "content-type": "text/plain" }).end(`404 ${rel}`);
      return;
    }

    const body = await readFile(file);
    res.writeHead(200, {
      "content-type": TYPES[extname(file)] ?? "application/octet-stream",
      // The library is a megabyte and a half of it; a reload should not refetch.
      "cache-control": "no-cache",
    }).end(body);
  } catch (err) {
    res.writeHead(500, { "content-type": "text/plain" }).end(String(err));
  }
});

server.listen(PORT, () => {
  console.log(`tonus → http://localhost:${PORT}`);
  console.log(`serving ${ROOT} — the same directory GitHub Pages publishes`);
});
