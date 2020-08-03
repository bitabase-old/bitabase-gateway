const http = require('http');

const test = require('tape');
const axios = require('axios');
const proxyRequest = require('../../common/proxyRequest');

function createMockServer (t, port, statusCode) {
  return http.createServer(function (request, response) {
    response.writeHead(statusCode);
    response.end('s' + port);
  }).listen(port);
}

test('proxy (get) - first strategy success', t => {
  t.plan(3);

  const mockServers = [];

  const config = {
    servers: [
      'http://localhost:9002',
      'http://localhost:9003',
      'http://localhost:9004'
    ]
  };

  mockServers[mockServers.length] = http.createServer(function (request, response) {
    proxyRequest(config, {
      strategy: 'first',
      validateStatus: statusCode => statusCode !== 404,
      request
    }, function (error, result) {
      t.notOk(error);
      response.writeHead(result.response.statusCode);
      response.write(result.body);
      response.end();
    });
  }).listen(9001);

  mockServers[mockServers.length] = createMockServer(t, 9002, 404);
  mockServers[mockServers.length] = createMockServer(t, 9003, 200);
  mockServers[mockServers.length] = createMockServer(t, 9004, 404);

  axios({
    url: 'http://localhost:9001',
    validateStatus: () => true,
    method: 'get'
  }).then(response => {
    t.equal(response.status, 200);
    t.equal(response.data, 's9003');

    mockServers.forEach(server => server.close());
  });
});

test('proxy (post) - first strategy success', t => {
  t.plan(3);

  const mockServers = [];

  const config = {
    servers: [
      'http://localhost:9002',
      'http://localhost:9003',
      'http://localhost:9004'
    ]
  };

  mockServers[mockServers.length] = http.createServer(function (request, response) {
    proxyRequest(config, {
      strategy: 'first',
      validateStatus: statusCode => statusCode !== 404,
      request
    }, function (error, result) {
      t.notOk(error);
      response.writeHead(result.response.statusCode);
      response.write(result.body);
      response.end();
    });
  }).listen(9001);

  mockServers[mockServers.length] = createMockServer(t, 9002, 404);
  mockServers[mockServers.length] = createMockServer(t, 9003, 200);
  mockServers[mockServers.length] = createMockServer(t, 9004, 404);

  axios({
    url: 'http://localhost:9001',
    validateStatus: () => true,
    method: 'post',
    data: 'test'
  }).then(response => {
    t.equal(response.status, 200);
    t.equal(response.data, 's9003');

    mockServers.forEach(server => server.close());
  });
});

test('proxy (post) - first strategy - fatal forwarded as no success', t => {
  t.plan(3);

  const mockServers = [];

  const config = {
    servers: [
      'http://localhost:9002',
      'http://localhost:9003',
      'http://localhost:9004'
    ]
  };

  mockServers[mockServers.length] = http.createServer(function (request, response) {
    proxyRequest(config, {
      strategy: 'first',
      validateStatus: statusCode => statusCode !== 404,
      request
    }, function (error, result) {
      t.notOk(error);
      response.writeHead(result.response.statusCode);
      response.write(result.body);
      response.end();
    });
  }).listen(9001);

  mockServers[mockServers.length] = createMockServer(t, 9002, 500);
  mockServers[mockServers.length] = createMockServer(t, 9003, 404);
  mockServers[mockServers.length] = createMockServer(t, 9004, 404);

  axios({
    url: 'http://localhost:9001',
    validateStatus: () => true,
    method: 'post',
    data: 'test'
  }).then(response => {
    t.equal(response.status, 500);
    t.equal(response.data, 's9002');

    mockServers.forEach(server => server.close());
  });
});
