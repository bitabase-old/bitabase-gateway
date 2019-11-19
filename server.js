const http = require('http');

const defaultConfig = require('./config');

const sendJsonResponse = require('./modules/sendJsonResponse');
const setCrossDomainOriginHeaders = require('./modules/setCrossDomainOriginHeaders');
const getDatabaseNameFromDomain = require('./common/getDatabaseNameFromDomain');
const getCollectionNameFromPath = require('./common/getCollectionNameFromPath');
const setupUsageCollector = require('./controllers/setupUsageCollector');

function createServer (configOverrides) {
  const config = {
    ...defaultConfig,
    ...configOverrides
  };

  const getRecords = require('./controllers/getRecords.js')(config);

  const usageCollector = setupUsageCollector(config);

  let server;
  async function start () {
    server = http.createServer((request, response) => {
      setCrossDomainOriginHeaders(request, response);

      const databaseName = getDatabaseNameFromDomain(
        config.accountMapper, request.headers.host
      );

      if (!databaseName) {
        return sendJsonResponse(404, {
          error: `database name "${databaseName}" not found`
        }, response);
      }

      const collectionName = getCollectionNameFromPath(request.url);
      if (!collectionName) {
        return sendJsonResponse(404, {
          error: `the collection "${databaseName}/${collectionName}" does not exist`
        }, response);
      }

      if (request.method === 'GET') {
        return getRecords(request, response, databaseName, collectionName, usageCollector.usageCollector);
      }

      sendJsonResponse(404, { error: 'not found' }, response);
    }).listen(config.port);

    console.log(`Listening on port ${config.port}`);

    return { start, stop };
  }

  function stop (callback) {
    usageCollector.stop(callback);
    server && server.close();
  }

  return {
    start,
    stop
  };
}

module.exports = createServer;
