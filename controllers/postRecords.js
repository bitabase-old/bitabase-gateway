const righto = require('righto');
const callarest = require('callarest');
const writeResponse = require('write-response');

const parseJsonBody = require('../modules/parseJsonBody');
const selectRandomItemFromArray = require('../modules/selectRandomItemFromArray');
const getCollectionDefinition = require('../common/getCollectionDefinition');
const createCollection = require('../common/createCollection');

function postRecordToServer (config, server, databaseName, collectionName, body, resolveMissing = true, callback) {
  callarest({
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
    url: `${server}/v1/databases/${databaseName}/records/${collectionName}`
  }, function (error, record) {
    if (error) {
      return callback(error);
    }

    if (record.response.statusCode === 404 && resolveMissing) {
      const collectionDefinition = righto(getCollectionDefinition, config, databaseName, collectionName);
      const createdCollection = righto(createCollection, server, databaseName, collectionName, collectionDefinition);

      createdCollection(function (error, result) {
        if (error) {
          return callback(error);
        }

        postRecordToServer(config, server, databaseName, collectionName, body, false, callback);
      });

      return;
    }

    callback(null, record);
  });
}

const performPost = config => function (request, response, databaseName, collectionName, usageCollector) {
  const server = selectRandomItemFromArray(config.servers);

  if (!server) {
    console.log('No server nodes found');
    return writeResponse(500, { error: 'Unexpected Server Error' }, response);
  }

  const body = righto(parseJsonBody, request);
  const postedRecord = righto(postRecordToServer, config, server, databaseName, collectionName, body, true);

  postedRecord(function (error, result) {
    if (error) {
      return writeResponse(error.status || 500, { error: error.message } || { error: 'Unexpected Server Error' }, response);
    }

    if (result.response.statusCode >= 200 && result.response.statusCode < 300) {
      usageCollector.tick(databaseName, collectionName, 'write');
    }
    writeResponse(result.response.statusCode, result.body, response);
  });
};

module.exports = performPost;
