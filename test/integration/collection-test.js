const test = require('tape')

const { bringUp, bringDown } = require('../helpers/environment')
const httpRequest = require('../helpers/httpRequest')
const { createUserAndSession } = require('../helpers/session')

const {
  createDatabase,
  createCollection,
  createRecord
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
  await createDatabase(session.asHeaders, {
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
  await createCollection(session.asHeaders, database, {
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
  await createCollection(session.asHeaders, database, {
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

test('missing collection -> two database servers -> proxy to an existing collection with 1 record', async t => {
  t.plan(7)

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
    name: 'foundcl',
    schema: {
      firstName: ['required', 'string'],
      lastName: ['required', 'string'],
      email: ['required', 'string']
    }
  })

  // Just do this to create the collections...
  await httpRequest('/foundcl', {
    baseURL: 'http://localhost:8082',
    headers: {
      host: 'founddb.bitabase.test'
    }
  })

  await createRecord(session.asHeaders, database, collection, {
    firstName: 'Joe',
    lastName: 'Bloggs',
    email: 'joe.bloggs@example.com'
  })

  const response = await httpRequest('/foundcl', {
    baseURL: 'http://localhost:8082',
    headers: {
      host: 'founddb.bitabase.test'
    }
  })

  t.equal(response.status, 200)

  t.equal(response.data.count, 1)
  t.equal(response.data.items.length, 1)
  t.ok(response.data.items[0].id)
  t.equal(response.data.items[0].firstName, 'Joe')
  t.equal(response.data.items[0].lastName, 'Bloggs')
  t.equal(response.data.items[0].email, 'joe.bloggs@example.com')

  await server.stop()
  await bringDown()
})
