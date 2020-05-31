if (process.env.NODE_ENV === 'development') {
  require('trace');
  require('clarify');
}

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

  const getRecord = require('./controllers/getRecord.js')(config);
  const getRecords = require('./controllers/getRecords.js')(config);
  const postRecords = require('./controllers/postRecords.js')(config);

  const usageCollector = setupUsageCollector(config);

  const [host, port] = config.bind.split(':');

  let server;
  function start () {
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

      const parsedUrl = new URL(`https://url.test${request.url}`);

      const collectionName = getCollectionNameFromPath(parsedUrl.pathname);
      if (!collectionName) {
        return sendJsonResponse(404, {
          error: `the collection "${databaseName}/${collectionName}" does not exist`
        }, response);
      }

      const recordId = request.url.split('/')[2];

      if (request.method === 'GET' && !recordId) {
        return getRecords(request, response, databaseName, collectionName, usageCollector.usageCollector);
      }

      if (request.method === 'GET' && recordId) {
        return getRecord(request, response, databaseName, collectionName, recordId, usageCollector.usageCollector);
      }

      if (request.method === 'POST') {
        return postRecords(request, response, databaseName, collectionName, usageCollector.usageCollector);
      }

      sendJsonResponse(404, { error: 'not found' }, response);
    }).listen(port, host);

    console.log(`[bitabase-gateway] Listening on ${host}:${port}`);

    return { start, stop };
  }

  function stop (callback) {
    console.log('[bitabase-gateway] Shutting down');
    usageCollector.stop(callback);
    server && server.close();
  }

  return {
    start,
    stop
  };
}

module.exports = createServer;
