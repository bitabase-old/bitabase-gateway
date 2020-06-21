const { promisify } = require('util');
const querystring = require('querystring');

const test = require('tape');
const writeResponse = require('write-response');

const httpRequest = require('../helpers/httpRequest');
const createMockServer = require('../helpers/createMockServer');

const createServer = require('../../server');

test('[get] missing collection -> missing db -> proxy to a none existing collection', async t => {
  t.plan(2);

  const mockServer = createMockServer(8000, function (request, response) {
    writeResponse(404, {}, response);
  });
  const mockManager = createMockServer(8001, function (request, response) {
    writeResponse(404, {}, response);
  });

  const server = await createServer({
    secret: 'test',
    servers: ['http://0.0.0.0:8000'],
    managers: ['http://0.0.0.0:8001']
  }).start();

  const result = await httpRequest('/one', {
    baseURL: 'http://localhost:8002',
    headers: {
      host: 'notfound.bitabase.test'
    }
  });

  mockServer.close();
  mockManager.close();
  await promisify(server.stop)();

  t.equal(result.status, 404);

  t.deepEqual(result.data, {
    error: 'the collection "notfound/one" does not exist'
  });
});

test('[get] missing collection -> existing db -> proxy to a none existing collection', async t => {
  t.plan(2);

  const mockServer = createMockServer(8000, function (request, response) {
    writeResponse(404, {}, response);
  });
  const mockManager = createMockServer(8001, function (request, response) {
    if (request.url === '/v1/users') {
      return writeResponse(200, { sessionId: 1, sessionSecret: 1 }, response);
    }
    if (request.url === '/v1/sessions') {
      return writeResponse(200, { sessionId: 1, sessionSecret: 1 }, response);
    }
    writeResponse(404, {}, response);
  });

  const server = await createServer({
    secret: 'test',
    servers: ['http://0.0.0.0:8000'],
    managers: ['http://0.0.0.0:8001']
  }).start();

  const result = await httpRequest('/notfoundcollection', {
    baseURL: 'http://localhost:8002',
    headers: {
      host: 'founddb.bitabase.test'
    }
  });

  mockServer.close();
  mockManager.close();
  await promisify(server.stop)();

  t.equal(result.status, 404);

  t.deepEqual(result.data, {
    error: 'the collection "founddb/notfoundcollection" does not exist'
  });
});

test('[get] missing collection -> proxy to an existing collection', async t => {
  t.plan(2);

  const mockServer = createMockServer(8000, function (request, response) {
    writeResponse(200, {
      count: 0,
      items: []
    }, response);
  });
  const mockManager = createMockServer(8001, function (request, response) {
    writeResponse(200, {}, response);
  });

  const server = await createServer({
    secret: 'test',
    servers: ['http://0.0.0.0:8000'],
    managers: ['http://0.0.0.0:8001']
  }).start();

  const response = await httpRequest('/foundcl', {
    baseURL: 'http://localhost:8002',
    headers: {
      host: 'founddb.bitabase.test'
    }
  });

  mockServer.close();
  mockManager.close();
  await promisify(server.stop)();

  t.equal(response.status, 200);

  t.deepEqual(response.data, {
    count: 0,
    items: []
  });
});

test('[get] missing collection -> proxy to an existing collection with item', async t => {
  t.plan(3);

  const mockServer = createMockServer(8000, function (request, response) {
    writeResponse(200, {
      count: 1,
      items: [{
        headerTest: 'yes'
      }]
    }, response);
  });
  const mockManager = createMockServer(8001, function (request, response) {
    if (request.url === '/v1/users') {
      return writeResponse(200, { sessionId: 1, sessionSecret: 1 }, response);
    }
    if (request.url === '/v1/sessions') {
      return writeResponse(200, { sessionId: 1, sessionSecret: 1 }, response);
    }
    writeResponse(200, {}, response);
  });

  const server = await createServer({
    secret: 'test',
    servers: ['http://0.0.0.0:8000'],
    managers: ['http://0.0.0.0:8001']
  }).start();

  await httpRequest(
    'http://0.0.0.0:8001/v1/databases/founddb/collections', {
      method: 'post',
      headers: {
        host: 'founddb.bitabase.test'
      },
      data: {
        name: 'foundcl',
        presenters: ['{...record headerTest: headers["x-hopefully"]}']
      }
    }
  );

  await httpRequest('/foundcl', {
    method: 'post',
    data: { a: 1 },
    baseURL: 'http://localhost:8002',
    headers: {
      host: 'founddb.bitabase.test'
    }
  });

  const response = await httpRequest('/foundcl', {
    baseURL: 'http://localhost:8002',
    headers: {
      host: 'founddb.bitabase.test',
      'X-Hopefully': 'yes'
    }
  });

  mockServer.close();
  mockManager.close();
  await promisify(server.stop)();

  t.equal(response.status, 200);
  t.equal(response.data.count, 1);
  t.equal(response.data.items[0].headerTest, 'yes');
});

test('[get] missing collection -> two database servers -> proxy to an existing collection', async t => {
  t.plan(2);

  const mockServer1 = createMockServer(8010, function (request, response) {
    writeResponse(200, {
      count: 0,
      items: []
    }, response);
  });
  const mockServer2 = createMockServer(8011, function (request, response) {
    writeResponse(200, {
      count: 0,
      items: []
    }, response);
  });
  const mockManager = createMockServer(8001, function (request, response) {
    if (request.url === '/v1/users') {
      return writeResponse(200, { sessionId: 1, sessionSecret: 1 }, response);
    }
    if (request.url === '/v1/sessions') {
      return writeResponse(200, { sessionId: 1, sessionSecret: 1 }, response);
    }
    writeResponse(200, {}, response);
  });

  const server = await createServer({
    secret: 'test',
    servers: ['http://0.0.0.0:8010', 'http://0.0.0.0:8011'],
    managers: ['http://0.0.0.0:8001']
  }).start();

  const response = await httpRequest('/foundcl', {
    baseURL: 'http://localhost:8002',
    headers: {
      host: 'founddb.bitabase.test'
    }
  });

  mockServer1.close();
  mockServer2.close();
  mockManager.close();
  await promisify(server.stop)();

  t.equal(response.status, 200);

  t.deepEqual(response.data, {
    count: 0,
    items: []
  });
});

test('[get] missing collection -> two database servers -> proxy to an existing collection with records', async t => {
  t.plan(9);

  const mockServer1 = createMockServer(8010, function (request, response) {
    writeResponse(200, {
      count: 10,
      items: Array(10).fill('').map((_, i) => ({
        id: i + 1,
        firstName: `Joe${i}`,
        lastName: `Bloggs${i}`,
        email: `joe.bloggs${i}@example.com`
      }))
    }, response);
  });
  const mockServer2 = createMockServer(8011, function (request, response) {
    writeResponse(200, {
      count: 10,
      items: Array(10).fill('').map((_, i) => ({
        id: i + 11,
        firstName: `Bill${i}`,
        lastName: `Bloggs${i}`,
        email: `joe.bloggs${i}@example.com`
      }))
    }, response);
  });
  const mockManager = createMockServer(8001, function (request, response) {
    writeResponse(200, {}, response);
  });

  const server = await createServer({
    secret: 'test',
    servers: ['http://0.0.0.0:8010', 'http://0.0.0.0:8011'],
    managers: ['http://0.0.0.0:8001']
  }).start();

  await httpRequest('/foundcl', {
    baseURL: 'http://localhost:8002',
    headers: {
      host: 'founddb.bitabase.test'
    }
  });

  const response = await httpRequest('/foundcl', {
    baseURL: 'http://localhost:8002',
    headers: {
      host: 'founddb.bitabase.test'
    }
  });

  mockServer1.close();
  mockServer2.close();
  mockManager.close();
  await promisify(server.stop)();

  t.equal(response.status, 200, 'correct status code 200 returned');

  t.equal(response.data.count, 20, 'correct count returned');
  t.equal(response.data.items.length, 10, 'correct items returned');

  t.ok(response.data.items[0].id, 'first item has id field');
  t.ok(response.data.items[0].firstName, 'first item has firstName field');
  t.ok(response.data.items[0].lastName, 'first item has lastName field');
  t.ok(response.data.items[0].email, 'first item has email field');

  t.ok(response.data.items.find(item => item.firstName === 'Joe4'), 'a record with firstName Joe4 exists');
  t.ok(response.data.items.find(item => item.lastName === 'Bloggs4'), 'a record with lastName Bloggs4 exists');
});

test('[get] missing collection -> two database servers -> proxy to an existing collection containing 1 record with a filter', async t => {
  t.plan(4);

  const mockServer = createMockServer(8000, function (request, response) {
    const url = new URL(`http://localhost${request.url}`);

    t.equal(url.searchParams.get('query'), '{"firstName":"Joe4"}');

    writeResponse(200, {
      count: 1,
      items: [{
        headerTest: 'yes'
      }]
    }, response);
  });
  const mockManager = createMockServer(8001, function (request, response) {
    writeResponse(200, {}, response);
  });

  const server = await createServer({
    secret: 'test',
    servers: ['http://0.0.0.0:8000'],
    managers: ['http://0.0.0.0:8001']
  }).start();

  const query = querystring.stringify({
    query: JSON.stringify({
      firstName: 'Joe4'
    })
  });

  const response = await httpRequest(`/foundcl?${query}`, {
    baseURL: 'http://localhost:8002',
    headers: {
      host: 'founddb.bitabase.test'
    }
  });

  mockServer.close();
  mockManager.close();
  await promisify(server.stop)();

  t.equal(response.status, 200, 'correct status code 200 returned');

  t.equal(response.data.count, 1, 'correct count returned');
  t.equal(response.data.items.length, 1, 'correct items returned');
});

test('[get] missing collection -> two database servers -> proxy to an existing collection containing 1 record with pagination', async t => {
  t.plan(4);

  const mockServer = createMockServer(8000, function (request, response) {
    const url = new URL(`http://localhost${request.url}`);

    t.equal(url.searchParams.get('query'), '{"limit":25,"offset":50}');

    writeResponse(200, {
      count: 1,
      items: [{
        headerTest: 'yes'
      }]
    }, response);
  });
  const mockManager = createMockServer(8001, function (request, response) {
    writeResponse(200, {}, response);
  });

  const server = await createServer({
    secret: 'test',
    servers: ['http://0.0.0.0:8000'],
    managers: ['http://0.0.0.0:8001']
  }).start();

  const query = querystring.stringify({
    query: JSON.stringify({
      limit: 25,
      offset: 50
    })
  });

  const response = await httpRequest(`/foundcl?${query}`, {
    baseURL: 'http://localhost:8002',
    headers: {
      host: 'founddb.bitabase.test'
    }
  });

  mockServer.close();
  mockManager.close();
  await promisify(server.stop)();

  t.equal(response.status, 200, 'correct status code 200 returned');

  t.equal(response.data.count, 1, 'correct count returned');
  t.equal(response.data.items.length, 1, 'correct items returned');
});
