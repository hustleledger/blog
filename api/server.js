const fs = require('fs');
const path = require('path');

const BLOCKED_PREFIXES = ['/admin', '/author', '/api', '/submissions', '/content', '/output'];
const ROOT = process.cwd();
const MIME = { '.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.xml':'application/xml','.txt':'text/plain','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon' };

function serve(res, code, filePath) {
  const ext = path.extname(filePath);
  res.writeHead(code, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'public, max-age=3600' });
  res.end(fs.readFileSync(filePath));
}

module.exports = (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let p = url.pathname;

  // Block private paths
  for (const prefix of BLOCKED_PREFIXES) {
    if (p === prefix || p.startsWith(prefix + '/')) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      return res.end('Not found');
    }
  }

  // Normalise: remove trailing slash (except root)
  if (p !== '/' && p.endsWith('/')) p = p.slice(0, -1);

  // Try exact file, then +.html, then +/index.html
  let candidates = [p];
  if (!path.extname(p)) {
    candidates.push(p + '.html');
    if (p !== '/') candidates.push(p + '/index.html');
    else candidates.push('/index.html');
  }

  for (const c of candidates) {
    const safe = c.startsWith('/') ? c.slice(1) : c;
    const fp = path.join(ROOT, safe);
    if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
      return serve(res, 200, fp);
    }
  }

  // 404
  const notFound = path.join(ROOT, '404.html');
  if (fs.existsSync(notFound)) return serve(res, 404, notFound);
  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.end('Not found');
};
