const callarest = require('callarest')
const righto = require('righto')

const config = require('../config')
const sendJsonResponse = require('../modules/sendJsonResponse')

const { ErrorObject } = require('../modules/error')

function createCollection (server, databaseName, collectionName, callback) {
  callback(null, true)
}

function getCollectionSchema (databaseName, collectionName, callback) {
  callarest({
    url: `${config.managerUrl}/v1/databases/${databaseName}/collections/${collectionName}`,
    headers: {
      'X-Internal-Secret': config.secret
    }
  }, callback)
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
      const records = righto(callarest, restOpts)
      records(callback)
    }
  })
}

function performGet (request, response, databaseName, collectionName) {
  const records = righto(getRecords, config.servers[0], databaseName, collectionName)

  records(function (error, records) {
    if (error) {
      return sendJsonResponse(500, 'unhandled error', response)
    }

    if (records.response.statusCode === 404) {
      return sendJsonResponse(404, {error: `the collection "${databaseName}/${collectionName}" does not exist`}, response)
    }

    sendJsonResponse(200, records.body, response)
  })
}

module.exports = performGet
