const test = require('tape')

const {bringUp, bringDown} = require('../helpers/environment')
const httpRequest = require('../helpers/httpRequest')
const { createUserAndSession } = require('../helpers/session')

const {
  createDatabase,
  createCollection
} = require('../helpers/databases')

const createServer = require('../../server')

test('missing collection -> missing db -> proxy to a none existing collection', async t => {
  t.plan(2)

  await bringUp()
  const server = await createServer().start()

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

test('missing collection -> existing db -> proxy to a none existing collection', async t => {
  t.plan(2)

  await bringUp()
  const server = await createServer().start()

  const session = await createUserAndSession()
  const database = await createDatabase(session.asHeaders, {
    name: 'founddb'
  })

  const result = await httpRequest('/notfoundcollection', {
    baseURL: 'http://localhost:8082',
    headers: {
      host: 'founddb.bitabase.test'
    }
  })

  t.equal(result.status, 404)

  t.deepEqual(result.data, {
    error: 'the collection "founddb/notfoundcollection" does not exist'
  })

  await server.stop()
  await bringDown()
})

test('missing collection -> proxy to an existing collection', async t => {
  t.plan(2)

  await bringUp()
  const server = await createServer().start()

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

test('missing collection -> two database servers -> proxy to an existing collection', async t => {
  t.plan(2)

  await bringUp(2)
  const server = await createServer({
    servers: [
      'http://localhost:8000',
      'http://localhost:8001'
    ]
  }).start()

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
