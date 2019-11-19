const test = require('tape');
const { promisify } = require('util');

const { bringUp, bringDown } = require('../helpers/environment');
const httpRequest = require('../helpers/httpRequest');
const { createUserAndSession } = require('../helpers/session');

const {
  createDatabase,
  createCollection,
  createRecord
} = require('../helpers/databases');

const createServer = require('../../server');

test('missing collection -> missing db -> proxy to a none existing collection', async t => {
  t.plan(2);

  await bringUp();
  const server = await createServer().start();

  const result = await httpRequest('/one', {
    baseURL: 'http://localhost:8082',
    headers: {
      host: 'notfound.bitabase.test'
    }
  });

  await promisify(server.stop)();
  await bringDown();

  t.equal(result.status, 404);

  t.deepEqual(result.data, {
    error: 'the collection "notfound/one" does not exist'
  });
});

test('missing collection -> existing db -> proxy to a none existing collection', async t => {
  t.plan(2);

  await bringUp();
  const server = await createServer().start();

  const session = await createUserAndSession();
  await createDatabase(session.asHeaders, {
    name: 'founddb'
  });

  const result = await httpRequest('/notfoundcollection', {
    baseURL: 'http://localhost:8082',
    headers: {
      host: 'founddb.bitabase.test'
    }
  });

  await promisify(server.stop)();
  await bringDown();

  t.equal(result.status, 404);

  t.deepEqual(result.data, {
    error: 'the collection "founddb/notfoundcollection" does not exist'
  });
});

test('missing collection -> proxy to an existing collection', async t => {
  t.plan(2);

  await bringUp();
  const server = await createServer().start();

  const session = await createUserAndSession();
  const database = await createDatabase(session.asHeaders, {
    name: 'founddb'
  });
  await createCollection(session.asHeaders, database, {
    name: 'foundcl'
  });

  const response = await httpRequest('/foundcl', {
    baseURL: 'http://localhost:8082',
    headers: {
      host: 'founddb.bitabase.test'
    }
  });

  await promisify(server.stop)();
  await bringDown();

  t.equal(response.status, 200);

  t.deepEqual(response.data, {
    count: 0,
    items: []
  });
});

test('missing collection -> two database servers -> proxy to an existing collection', async t => {
  t.plan(2);

  await bringUp(2);
  const server = await createServer({
    servers: [
      'http://localhost:8000',
      'http://localhost:8001'
    ]
  }).start();

  const session = await createUserAndSession();
  const database = await createDatabase(session.asHeaders, {
    name: 'founddb'
  });
  await createCollection(session.asHeaders, database, {
    name: 'foundcl'
  });

  const response = await httpRequest('/foundcl', {
    baseURL: 'http://localhost:8082',
    headers: {
      host: 'founddb.bitabase.test'
    }
  });

  await promisify(server.stop)();
  await bringDown();

  t.equal(response.status, 200);

  t.deepEqual(response.data, {
    count: 0,
    items: []
  });
});

test('missing collection -> two database servers -> proxy to an existing collection with 1 record', async t => {
  t.plan(9);

  await bringUp(2);
  const server = await createServer({
    servers: [
      'http://localhost:8000',
      'http://localhost:8001'
    ]
  }).start();

  const session = await createUserAndSession();
  const database = await createDatabase(session.asHeaders, {
    name: 'founddb'
  });
  const collection = await createCollection(session.asHeaders, database, {
    name: 'foundcl',
    schema: {
      firstName: ['required', 'string'],
      lastName: ['required', 'string'],
      email: ['required', 'string']
    }
  });

  // Do a GET to create the collections from manager api...
  await httpRequest('/foundcl', {
    baseURL: 'http://localhost:8082',
    headers: {
      host: 'founddb.bitabase.test'
    }
  });

  const promises = [];
  const servers = [
    'http://localhost:8000',
    'http://localhost:8001'
  ];

  for (let i = 0; i < 10; i++) {
    promises.push(
      createRecord({
        headers: session.asHeaders,
        database: database,
        collection: collection,
        server: servers[i % 2],
        data: {
          firstName: `Joe${i}`,
          lastName: `Bloggs${i}`,
          email: `joe.bloggs${i}@example.com`
        }
      })
    );
  }

  await Promise.all(promises);

  const response = await httpRequest('/foundcl', {
    baseURL: 'http://localhost:8082',
    headers: {
      host: 'founddb.bitabase.test'
    }
  });

  await promisify(server.stop)();
  await bringDown();

  t.equal(response.status, 200, 'correct status code 200 returned');

  t.equal(response.data.count, 10, 'correct count returned');
  t.equal(response.data.items.length, 10, 'correct items returned');

  t.ok(response.data.items[0].id, 'first item has id field');
  t.ok(response.data.items[0].firstName, 'first item has firstName field');
  t.ok(response.data.items[0].lastName, 'first item has lastName field');
  t.ok(response.data.items[0].email, 'first item has email field');

  t.ok(response.data.items.find(item => item.firstName === 'Joe1'), 'a record with firstName Joe1 exists');
  t.ok(response.data.items.find(item => item.lastName === 'Bloggs9'), 'a record with lastName Bloggs9 exists');
});
