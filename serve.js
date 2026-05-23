/**
 * serve.js — Minimal production static-file server for Daily Bible Journal
 * Uses only Node.js built-in modules. No npm install needed.
 * Serves the dist/ folder at http://localhost:5173
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT    = 5173;
const WEBROOT = path.join(__dirname, 'app'); // files land in app\ inside install dir

const MIME = {
  '.html' : 'text/html; charset=utf-8',
  '.js'   : 'application/javascript; charset=utf-8',
  '.css'  : 'text/css; charset=utf-8',
  '.svg'  : 'image/svg+xml',
  '.json' : 'application/json',
  '.ico'  : 'image/x-icon',
  '.png'  : 'image/png',
  '.woff2': 'font/woff2',
  '.woff' : 'font/woff',
  '.ttf'  : 'font/ttf',
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0].split('#')[0];
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';

  const filePath = path.join(WEBROOT, urlPath);

  // Security: block path traversal
  if (!filePath.startsWith(WEBROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback — always serve index.html for unknown routes
      fs.readFile(path.join(WEBROOT, 'index.html'), (err2, html) => {
        if (err2) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      });
      return;
    }

    const contentType = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type'  : contentType,
      'Cache-Control' : ext === '.html' ? 'no-cache' : 'public, max-age=31536000',
    });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  // Intentionally no console output — this process runs hidden
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    // Port already in use — another instance is probably running, that's fine
    process.exit(0);
  }
});
