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

function transformCallarestResult(result, callback){
  if (result.statusCode === 200){
    return callback(null, result.body)
  }

  callback({
    ...result.response.body,
    statusCode: result.response.statusCode
  })
}

function getRestOptions(server, databaseName, collectionName){
  return {
    url: `${server}/v1/databases/${databaseName}/collections/${collectionName}/records`
  }
}

function getRecordsFromServer(server, databaseName, collectionName, callback){
  const restOptions = getRestOptions(server, databaseName, collectionName)

  const recordResponse = righto(callarest, restOptions)
  const peerRecords = righto(transformCallarestResult, recordResponse)
  const result = righto.handle(peerRecords, (error, callback) => {
    if (error.statusCode === 404) {
      return callback({statusCode: 404, body: { error: `the collection "${databaseName}/${collectionName}" does not exist`}})
    }

    callback(error)
  })

  result(callback)
}

function checkOnServer(server, databaseName, collectionName, callback){
  const collectionSchema = righto(getCollectionSchema, databaseName, collectionName)
  const serverCollection = righto(createCollection, server, databaseName, collectionSchema, collectionName)
  const records = righto(getRecordsFromServer, server, databaseName, collectionName, righto.after(serverCollection))
  records(callback)
}

function getRecords (server, databaseName, collectionName, callback) {
  const peerRecords = righto(getRecordsFromServer, server, databaseName, collectionName)
  const records = righto.handle(peerRecords, (error, callback) => {
    if(error.statusCode !== 404){
      return callback(error)
    }

    checkOnServer(server, databaseName, collectionName, callback)
  })

  records(callback)
}

function performGet (request, response, databaseName, collectionName) {
  const records = righto(getRecords, config.servers[0], databaseName, collectionName)

  records(function (error, records) {
    if (error) {
      const errorBody = error.statusCode && error.statusCode < 500 && error.body || 'unhandled error'
      return sendJsonResponse(error.statusCode || 500, errorBody, response)
    }

    sendJsonResponse(200, records.body, response)
  })
}

module.exports = performGet
