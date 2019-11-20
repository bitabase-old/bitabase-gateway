const test = require('tape');
const { promisify } = require('util');

const { bringUp, bringDown } = require('../helpers/environment');
const httpRequest = require('../helpers/httpRequest');
const { createUserAndSession } = require('../helpers/session');

const {
  createDatabase,
  createCollection
} = require('../helpers/databases');

const createServer = require('../../server');

test('[post] missing collection -> missing db -> proxy to a none existing collection', async t => {
  t.plan(2);

  await bringUp();
  const server = await createServer().start();

  const result = await httpRequest('/one', {
    method: 'post',
    data: { a: 1 },
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

test('[post] missing collection -> existing db -> proxy to a none existing collection', async t => {
  t.plan(2);

  await bringUp();
  const server = await createServer().start();

  const session = await createUserAndSession();
  await createDatabase(session.asHeaders, {
    name: 'founddb'
  });

  const result = await httpRequest('/notfoundcollection', {
    method: 'post',
    data: { a: 1 },
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

test('[post] missing collection -> proxy to an existing collection', async t => {
  t.plan(10);

  await bringUp();
  const server = await createServer().start();

  const session = await createUserAndSession();
  const database = await createDatabase(session.asHeaders, {
    name: 'founddb'
  });
  await createCollection(session.asHeaders, database, {
    name: 'foundcl'
  });

  const createResponse = await httpRequest('/foundcl', {
    method: 'post',
    data: {
      firstName: 'Joe',
      lastName: 'Bloggs',
      email: 'joe.bloggs@example.com'
    },
    baseURL: 'http://localhost:8082',
    headers: {
      host: 'founddb.bitabase.test'
    }
  });

  const getResponse = await httpRequest(`/foundcl/${createResponse.data.id}`, {
    baseURL: 'http://localhost:8082',
    headers: {
      host: 'founddb.bitabase.test'
    }
  });

  await promisify(server.stop)();
  await bringDown();

  t.equal(createResponse.status, 201);
  t.equal(createResponse.data.firstName, 'Joe');
  t.equal(createResponse.data.lastName, 'Bloggs');
  t.equal(createResponse.data.email, 'joe.bloggs@example.com');
  t.ok(createResponse.data.id);

  t.equal(getResponse.status, 200);
  t.equal(getResponse.data.firstName, 'Joe');
  t.equal(getResponse.data.lastName, 'Bloggs');
  t.equal(getResponse.data.email, 'joe.bloggs@example.com');
  t.equal(getResponse.data.id, createResponse.data.id);
});
