/**
 * dev-proxy.js — Unified dev proxy for Daluxe
 */
console.log('--- Proxy Debug: Starting ---');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const PROXY_PORT = 8081;
const EXPO_PORT  = 8082;
const ADMIN_PORT = 3002;

const app = express();

console.log('--- Proxy Debug: Creating Unified Proxy ---');
app.use(
  createProxyMiddleware({
    router: (req) => {
      // Forward Admin, API, and Next.js internal assets to the Admin backend
      if (req.url.startsWith('/admin') || req.url.startsWith('/api') || req.url.startsWith('/_next')) {
        return `http://localhost:${ADMIN_PORT}`;
      }
      return `http://localhost:${EXPO_PORT}`;
    },
    changeOrigin: true,
    ws: true,
    logger: console,
  })
);

console.log(`--- Proxy Debug: Attempting to listen on ${PROXY_PORT} ---`);
app.listen(PROXY_PORT, () => {
  console.log(`\n🚀 Daluxe Dev Proxy -> http://localhost:${PROXY_PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PROXY_PORT} is already in use.`);
  } else {
    console.error('\n❌ Proxy process failed:', err);
  }
  process.exit(1);
});
