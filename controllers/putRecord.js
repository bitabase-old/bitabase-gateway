const proxyRequest = require('../common/proxyRequest');
const sendJsonResponse = require('../modules/sendJsonResponse');

function performPut (config) {
  return function (request, response, databaseName, collectionName, usageCollector) {
    proxyRequest(config, {
      strategy: 'first',
      validateStatus: statusCode => statusCode !== 404,
      request
    }, function (error, result) {
      if (error) {
        console.log(error);
        sendJsonResponse(500, '', response);
        return;
      }

      if (result.response.statusCode === 404) {
        sendJsonResponse(404, { error: `the collection "${databaseName}/${collectionName}" does not exist` }, response);
        return;
      }

      usageCollector.tick(databaseName, collectionName, 'update', 1);

      response.writeHead(result.response.statusCode);
      response.write(result.body);
      response.end();
    });
  };
}

module.exports = performPut;
