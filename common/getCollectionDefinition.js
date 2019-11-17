const callarest = require('callarest')
const config = require('../config')

function getCollectionSchema (databaseName, collectionName, callback) {
  callarest({
    url: `${config.managerUrl}/v1/databases/${databaseName}/collections/${collectionName}`,
    headers: {
      'X-Internal-Secret': config.secret
    }
  }, function (error, result) {
    if (error) {
      return callback(error)
    }

    if (result.response.statusCode === 200) {
      return callback(null, JSON.parse(result.body))
    }

    if (result.response.statusCode === 404) {
      return callback({
        status: 404,
        message: `the collection "${databaseName}/${collectionName}" does not exist`,
        ...result
      })
    }

    callback(result)
  })
}

module.exports = getCollectionSchema
