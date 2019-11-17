const callarest = require('callarest')

const sendJsonResponse = require('../modules/sendJsonResponse')
const getCollectionDefinition = require('../common/getCollectionDefinition')

function createCollection (server, databaseName, collectionName, collectionDefinition, callback) {
  callarest({
    method: 'post',
    url: `${server}/v1/databases/${databaseName}/collections`,
    data: collectionDefinition.schema
  }, callback)
}

const getRecordsFromServer = (server, collectionDefinition, databaseName, collectionName, callback) => {
  callarest({
    url: `${server}/v1/databases/${databaseName}/collections/${collectionName}/records`
  }, function (error, records) {
    if (error) {
      return callback(error)
    }

    if (records.response.statusCode === 200) {
      return callback(null, records)
    }

    if (records.response.statusCode === 404 && collectionDefinition) {
      createCollection(server, databaseName, collectionName, collectionDefinition, function (error, result) {
        if (error) {
          return callback(error)
        }

        getRecordsFromServer(server, null, databaseName, collectionName, callback)
      })
      return
    }

    callback(records)
  })
}

function sendFinalResponseToServer (allErrors, allRecords, response) {
  if (allErrors.length > 0) {
    console.log({ allErrors })
    return sendJsonResponse(500, 'Unexpected Server Error', response)
  }

  const accumulatedRecords = allRecords.reduce((acc, record) => {
    acc.count = acc.count + record.count
    acc.items = acc.items.concat(record.items)
    return acc
  }, {
    count: 0,
    items: []
  })

  return sendJsonResponse(200, accumulatedRecords, response)
}

const performGet = config => function (request, response, databaseName, collectionName) {
  getCollectionDefinition(databaseName, collectionName, function (error, collectionDefinition) {
    if (error) {
      return sendJsonResponse(error.status, { error: error.message }, response)
    }

    const allErrors = []
    const allRecords = []
    let serverResponses = 0
    function handleRecordsFromServer (error, records) {
      serverResponses = serverResponses + 1
      if (error) {
        allErrors.push(error)
      }

      if (records && records.response.statusCode === 200) {
        allRecords.push(JSON.parse(records.body))
      }

      const isDone = serverResponses === config.servers.length
      if (isDone) {
        sendFinalResponseToServer(allErrors, allRecords, response)
      }
    }

    config.servers.forEach(server =>
      getRecordsFromServer(server, collectionDefinition, databaseName, collectionName, handleRecordsFromServer)
    )
  })
}

module.exports = performGet
