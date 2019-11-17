const httpRequest = require('./httpRequest')
const config = require('../../config')

const createDatabase = async (headers, data) => {
  const request = await httpRequest('/v1/databases', {
    baseURL: config.managerUrl,
    method: 'post',
    headers,
    data: data || {
      name: 'testdb'
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
      schema: {
        firstName: ['required', 'string'],
        lastName: ['required', 'string'],
        email: ['required', 'string']
      }
    }
  })
  return request.data
}

const createRecord = async (headers, database, collection, data) => {
  const request = await httpRequest(`/v1/databases/${database.name}/collections/${collection.name}/records`, {
    baseURL: config.servers[0],
    method: 'post',
    headers,
    data: data || {
      name: 'testdb',
      schema: {
        firstName: 'Joe',
        lastName: 'Bloggs',
        email: 'joe.bloggs@example.com'
      }
    }
  })
  return request.data
}

module.exports = {
  createDatabase,
  createCollection,
  createRecord
}
