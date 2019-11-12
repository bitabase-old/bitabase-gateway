const callarest = require('callarest')
const righto = require('righto')

const config = require('../config')
const sendJsonResponse = require('../modules/sendJsonResponse')

const { ErrorObject } = require('../modules/error')

function createCollection (server, databaseName, collectionSchema, collectionName, callback) {
  const parsedBody = JSON.parse(collectionSchema)
  callarest({
    method: 'post',
    url: `${server}/v1/databases/${databaseName}/collections`,
    data: parsedBody.schema
  }, callback)
}

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
      return callback(null, result.body)
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

function getRecords (server, databaseName, collectionName, callback) {
  const restOpts = {
    url: `${server}/v1/databases/${databaseName}/collections/${collectionName}/records`
  }

  callarest(restOpts, function (error, records) {
    if (error) {
      return callback(error)
    }

    if (records.response.statusCode === 200) {
      return callback(null, records)
    }

    if (records.response.statusCode === 404) {
      const collectionSchema = righto(getCollectionSchema, databaseName, collectionName)
      const serverCollection = righto(createCollection, server, databaseName, collectionSchema, collectionName)
      const records = righto(callarest, restOpts, righto.after(serverCollection))
      records(callback)
    }
  })
}

function performGet (request, response, databaseName, collectionName) {
  const records = righto(getRecords, config.servers[0], databaseName, collectionName)

  records(function (error, records) {
    if (error) {
      return sendJsonResponse(error.status, {error: error.message}, response)
    }

    if (records.response.statusCode === 404) {
      return sendJsonResponse(404, {error: `the collection "${databaseName}/${collectionName}" does not exist`}, response)
    }

    sendJsonResponse(200, JSON.parse(records.body), response)
  })
}

module.exports = performGet
