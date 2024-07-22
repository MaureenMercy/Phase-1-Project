const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares);

// Add custom routes before JSON Server router
server.get('/echo', (req, res) => {
  res.jsonp(req.query);
});

// To handle POST, PUT and PATCH you need to use a body-parser
// You can use the one used by JSON Server
server.use(jsonServer.bodyParser);

// Add custom middleware for audit logging
server.use((req, res, next) => {
  if (req.method !== 'GET') {
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      body: req.body
    };
    const db = router.db;
    db.get('auditLogs').push(log).write();
  }
  next();
});

// Use default router
server.use(router);

// Start server
const port = 3000;
server.listen(port, () => {
  console.log(`JSON Server is running on port ${port}`);
});