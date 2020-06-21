if (process.env.NODE_ENV === 'development') {
  require('async-bugs');
}

const http = require('http');

const sendJsonResponse = require('./modules/sendJsonResponse');
const getDatabaseNameFromDomain = require('./common/getDatabaseNameFromDomain');
const getCollectionNameFromPath = require('./common/getCollectionNameFromPath');
const setupUsageCollector = require('./controllers/setupUsageCollector');
const setupServerSyncer = require('./controllers/setupServerSyncer');

function createServer (config = {}) {
  config.bindHost = config.bindHost || '0.0.0.0';
  config.bindPort = config.bindPort || 8002;
  config.accountMapper = config.accountMapper || '(.*).bitabase.test';

  if (!config.secret) {
    throw new Error('Config option secret is required but was not provided');
  }

  const getRecord = require('./controllers/getRecord.js')(config);
  const getRecords = require('./controllers/getRecords.js')(config);
  const postRecords = require('./controllers/postRecords.js')(config);

  const usageCollector = setupUsageCollector(config);
  const serverSyncer = setupServerSyncer(config);

  let server;
  function start () {
    server = http.createServer((request, response) => {
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
    });

    server.on('listening', function () {
      const address = server.address();
      console.log(`[bitabase-manager] Listening on ${config.bindHost} (${address.address}:${address.port})`);
    });

    server.listen(config.bindPort, config.bindHost);

    return { start, stop };
  }

  function stop (callback) {
    console.log('[bitabase-gateway] Shutting down');
    usageCollector.stop();
    serverSyncer && serverSyncer.stop && serverSyncer.stop();
    server && server.close();
    callback && callback();
  }

  return {
    start,
    stop
  };
}

module.exports = createServer;
