const http = require('http');

function getXHeaders (headers) {
  return Object
    .keys(headers)
    .filter(key => key.toLowerCase().startsWith('x-'))
    .reduce((accumulator, headerKey) => {
      accumulator[headerKey] = headers[headerKey];
      return accumulator;
    }, {});
}

function proxyRequest (config, options, callback) {
  const validateStatus = options.validateStatus || (() => true);

  const responses = [];
  config.servers.forEach(server => {
    const uri = new URL(server);

    const opts = {
      method: options.request.method,
      hostname: uri.hostname,
      port: uri.port,
      path: `${uri.pathname}${uri.search}`,
      protocol: uri.protocol,
      headers: getXHeaders(options.request.headers)
    };

    const proxiedRequest = http
      .request(opts, response => {
        const buffer = [];
        response.on('data', data => {
          buffer.push(data);
        });
        proxiedRequest.on('close', () => {
          const result = {
            response,
            body: Buffer.concat(buffer)
          };

          responses.push(result);

          if (!responses.length > 0 && validateStatus(response.statusCode)) {
            callback(null, result);
          } else if (responses.length >= config.servers.length) {
            const validResponses = responses.filter(result => validateStatus(result.response.statusCode));
            callback(null, validResponses[0] || result);
          }
        });
      });
    options.request.pipe(proxiedRequest);
  });
}

module.exports = proxyRequest;
