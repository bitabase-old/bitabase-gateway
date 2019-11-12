const test = require('tape')

const {bringUp, bringDown} = require('../helpers/reset')
const httpRequest = require('../helpers/httpRequest')
const { createUserAndSession } = require('../helpers/session')

const {
  createDatabase,
  createCollection
} = require('../helpers/databases')

const server = require('../../server')

test('missing collection -> proxy to a none existing collection', async t => {
  t.plan(2)

  await bringUp()
  await server.start()

  const result = await httpRequest('/one', {
    baseURL: 'http://localhost:8082',
    headers: {
      host: 'notfound.bitabase.test'
    }
  })

  t.equal(result.status, 404)

  t.deepEqual(result.data, {
    error: 'the collection "notfound/one" does not exist'
  })

  await server.stop()
  await bringDown()
})

test('missing collection -> proxy to an existing collection', async t => {
  t.plan(2)

  await bringUp()
  await server.start()

  const session = await createUserAndSession()
  const database = await createDatabase(session.asHeaders, {
    name: 'founddb'
  })
  const collection = await createCollection(session.asHeaders, database, {
    name: 'foundcl'
  })

  const response = await httpRequest('/foundcl', {
    baseURL: 'http://localhost:8082',
    headers: {
      host: 'founddb.bitabase.test'
    }
  })

  t.equal(response.status, 200)

  t.deepEqual(response.data, {
    count: 0,
    items: []
  })

  await server.stop()
  await bringDown()
})
