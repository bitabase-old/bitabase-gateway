const { promisify } = require('util');

const callarest = require('callarest');
const selectRandomItemFromArray = require('../modules/selectRandomItemFromArray');
const ErrorObject = require('../modules/error');

function getCollectionDefinition (config, databaseName, collectionName, callback) {
  if (!callback) {
    return promisify(getCollectionDefinition)(config, databaseName, collectionName);
  }

  const managerUrl = selectRandomItemFromArray(config.managers);

  if (!managerUrl) {
    return callback(new Error('no manager nodes exist'));
  }

  callarest({
    url: `${managerUrl}/v1/databases/${databaseName}/collections/${collectionName}`,
    headers: {
      'X-Internal-Secret': config.secret
    }
  }, function (error, result) {
    if (error) {
      return callback(error);
    }

    if (result.response.statusCode === 200) {
      return callback(null, JSON.parse(result.body));
    }

    if (result.response.statusCode === 404) {
      return callback(new ErrorObject({
        status: 404,
        message: `the collection "${databaseName}/${collectionName}" does not exist`,
        ...result
      }));
    }

    callback(result);
  });
}

module.exports = getCollectionDefinition;
