const http = require('http')
const path = require('path')
const axios = require('axios')

const config = require('./config')

const sendJsonResponse = require('./modules/sendJsonResponse')
const setCrossDomainOriginHeaders = require('./modules/setCrossDomainOriginHeaders')
const getDatabaseNameFromDomain = require('./common/getDatabaseNameFromDomain')
const getCollectionNameFromPath = require('./common/getCollectionNameFromPath')

const getRecords = require('./controllers/getRecords.js')

let server

async function start () {
  server = http.createServer((request, response) => {
    setCrossDomainOriginHeaders(request, response)

    const databaseName = getDatabaseNameFromDomain(
      config.accountMapper, request.headers.host
    )

    if (!databaseName) {
      return sendJsonResponse(404, {
        error: `database name "${databaseName}" not found`
      }, response)
    }

    const collectionName = getCollectionNameFromPath(request.url)
    if (!collectionName) {
      return sendJsonResponse(404, {
        error: `the collection "${databaseName}/${collectionName}" does not exist`
      }, response)
    }

    if (request.method === 'GET') {
      return getRecords(request, response, databaseName, collectionName)
    }

    sendJsonResponse(404, {error: 'not found'}, response)
  }).listen(config.port)

  console.log(`Listening on port ${config.port}`)
}

function stop () {
  server && server.close()
}

module.exports = {
  start,
  stop
}
