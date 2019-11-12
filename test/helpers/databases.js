const httpRequest = require('./httpRequest')
const config = require('../../config')

const createDatabase = async (headers, data) => {
  const request = await httpRequest('/v1/databases', {
    baseURL: config.managerUrl,
    method: 'post',
    headers,
    data: data || {
      name: 'testdb',
    }
  })
  return request.data
}

const createCollection = async (headers, database, data) => {
  const request = await httpRequest(`/v1/databases/${database.name}/collections`, {
    baseURL: config.managerUrl,
    method: 'post',
    headers,
    data: data || {
      name: 'testdb',
    }
  })
  return request.data
}

module.exports = {
  createDatabase,
  createCollection
}
