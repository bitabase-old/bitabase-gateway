const { promisify } = require('util');

const os = require('os');

const rqlite = {
  connect: promisify(require('rqlite-fp/connect')),
  getAll: promisify(require('rqlite-fp/getAll')),
  getOne: promisify(require('rqlite-fp/getOne')),
  run: promisify(require('rqlite-fp/run'))
};

async function setupServerSyncer (config, type) {
  if (!config.rqliteAddr) {
    console.log('Syncing Disabled: No rqlite address provided');
    return;
  }

  const dbConnection = await rqlite.connect(config.rqliteAddr, {
    retries: 3,
    retryDelay: 250,
    onRetry: () => console.log('Could not connect to: ' + config.dataServer + '. Trying again...')
  });

  await rqlite.run(dbConnection, 'CREATE TABLE IF NOT EXISTS servers (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, host TEXT, lastPing INTEGER)');

  async function pingSelfInDatabase () {
    const server = await rqlite.getOne(dbConnection, 'SELECT * FROM servers WHERE type = ? AND host = ?', [type, os.hostname()]);
    if (!server) {
      await rqlite.run(dbConnection, 'INSERT INTO servers (type, host, lastPing) VALUES (?, ?, ?)', [type, os.hostname(), Date.now()]);
    } else {
      await rqlite.run(dbConnection, 'UPDATE servers SET lastPing = ? WHERE type = ? AND host = ?', [type, Date.now(), os.hostname()]);
    }
  }

  async function syncServers (type, servers) {
    config[type] = config[type] || [];

    servers.forEach(server => {
      const withinPingLimits = Date.now() - server.lastPing < 15000;
      if (!config[type].includes(server.host) && withinPingLimits) {
        config[type].push(server.host);
        console.log(`Discovered new server in data store: [${server.host}]`);
      }

      if (config[type].includes(server.host) && !withinPingLimits) {
        const index = config[type].indexOf(server.host);
        if (index !== -1) config[type].splice(index, 1);

        console.log(`Removed server as last ping longer than 15 seconds: [${server.host}]`);
      }
    });

    config[type].forEach(serverHost => {
      if (!servers.find(server => server.host === serverHost)) {
        const index = config[type].indexOf(serverHost);
        if (index !== -1) config[type].splice(index, 1);

        console.log(`Removed server no longer in data store: [${serverHost}]`);
      }
    });
  }

  async function syncLoop () {
    pingSelfInDatabase();

    let servers = [];
    try {
      servers = await rqlite.getAll(dbConnection, 'SELECT * FROM servers');
    } catch (error) {
      if (error.message.includes('no such table: servers')) {
        return console.log('RQ_LITE Database not setup');
      }
      throw error;
    }

    syncServers('server', servers.filter(server => server.type === 'server'));
    syncServers('manager', servers.filter(server => server.type === 'manager'));
    syncServers('gateway', servers.filter(server => server.type === 'gateway'));
  }

  const timer = setInterval(syncLoop, 2000);

  syncLoop();

  function stop (callback) {
    clearInterval(timer);
    callback && callback();
  }

  return {
    stop
  };
}

module.exports = setupServerSyncer;
