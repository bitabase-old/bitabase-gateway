const http = require('http');

function createMockServer (port, fn) {
  const server = http.createServer(function (request, response) {
    console.log(`Manager mock requsted: ${request.method} ${request.url}`);

    fn(request, response);
  });

  server.listen(port);

  return server;
}

module.exports = createMockServer;
