const http = require('http');

const PORT = 3000;
const ENABLE_SERVER = process.env.ENABLE_SERVER === 'true';
const OPENCHAMBER_ENABLED = process.env.OPENCHAMBER_ENABLED === 'true';
const OPENCHAMBER_PORT = parseInt(process.env.OPENCHAMBER_PORT || '3010', 10);
const OPENCODE_SERVER_PORT = 4096;

const BACKEND_PORT = ENABLE_SERVER ? OPENCODE_SERVER_PORT : OPENCHAMBER_PORT;
const BACKEND_HOST = '127.0.0.1';

function handleRequest(req, res) {
  if (!ENABLE_SERVER && !OPENCHAMBER_ENABLED) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Open Web UI</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 2em; max-width: 600px; margin: 0 auto; color: #333; }
    h1 { font-size: 1.5em; margin-bottom: 0.5em; }
    p { line-height: 1.5; }
    code { background: #f0f0f0; padding: 0.2em 0.4em; border-radius: 3px; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>Open Web UI</h1>
  <p>Neither OpenChamber nor the OpenCode LAN server is enabled.</p>
  <p>Enable <strong>OpenChamber Interface</strong> or <strong>OpenCode LAN Server</strong> in the add-on Configuration tab and restart.</p>
  <p>You can still access the <strong>Open OpenCode CLI</strong> terminal from the sidebar.</p>
</body>
</html>`);
    return;
  }

  const options = {
    hostname: BACKEND_HOST,
    port: BACKEND_PORT,
    path: req.url,
    method: req.method,
    headers: Object.assign({}, req.headers),
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Proxy Error: backend unavailable');
  });

  req.pipe(proxyReq);
}

const server = http.createServer(handleRequest);

server.on('upgrade', (req, socket, head) => {
  if (!ENABLE_SERVER && !OPENCHAMBER_ENABLED) {
    socket.destroy();
    return;
  }

  const options = {
    hostname: BACKEND_HOST,
    port: BACKEND_PORT,
    path: req.url,
    headers: Object.assign({}, req.headers),
  };

  const proxyReq = http.request(options);
  proxyReq.on('upgrade', (proxyRes, proxySocket) => {
    proxySocket.write(head);
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });
  proxyReq.on('error', () => socket.destroy());
  proxyReq.end();
});

server.listen(PORT, () => {
  console.log(`Ingress router listening on :${PORT}`);
  console.log(`Routing to: ${ENABLE_SERVER ? 'OpenCode server (:4096)' : 'OpenChamber (:' + OPENCHAMBER_PORT + ')'}`);
});
