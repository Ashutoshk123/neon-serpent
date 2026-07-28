/* Tiny static file server so you can play Neon Serpent on your phone.
   Used automatically by start-server.bat when Python isn't installed.
   Run manually with:  node phone-server.js         */
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const PORT = Number(process.env.PORT) || 8000;
const ROOT = __dirname;
const MIME = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json',
  '.webmanifest':'application/manifest+json', '.png':'image/png',
  '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.ico':'image/x-icon'
};

http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p === '/' || p === '') p = '/index.html';
  const file = path.join(ROOT, path.normalize(p).replace(/^[\\/]+/, ''));
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, {'Content-Type':'text/plain'}); res.end('Not found'); return; }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(buf);
  });
}).listen(PORT, '0.0.0.0', () => {
  console.log('\n  NEON SERPENT server is running. On your phone, open:\n');
  let found = false;
  for (const list of Object.values(os.networkInterfaces())) {
    for (const n of list || []) {
      if (n.family === 'IPv4' && !n.internal) { console.log('      http://' + n.address + ':' + PORT); found = true; }
    }
  }
  if (!found) console.log('      (no network address found - is Wi-Fi connected?)');
  console.log('\n  Keep this window open while you play.  Press Ctrl+C to stop.\n');
}).on('error', e => {
  console.error('\n  Could not start server:', e.message);
  if (e.code === 'EADDRINUSE') console.error('  Port ' + PORT + ' is busy. Try:  set PORT=8080 && node phone-server.js\n');
});
