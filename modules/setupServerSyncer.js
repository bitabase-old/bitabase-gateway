const { promisify } = require('util');

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

  const hostAddress = `http://${config.advertiseHost}:${config.bindPort}`;

  const dbConnection = await rqlite.connect(config.rqliteAddr, {
    retries: 10,
    retryDelay: 3000,
    onRetry: () => console.log('Could not connect to: ' + config.dataServer + '. Trying again...')
  });

  await rqlite.run(dbConnection, 'CREATE TABLE IF NOT EXISTS servers (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT, host TEXT, lastPing INTEGER)');

  async function pingSelfInDatabase () {
    const server = await rqlite.getOne(dbConnection, 'SELECT * FROM servers WHERE type = ? AND host = ?', [type, hostAddress]);
    if (!server) {
      await rqlite.run(dbConnection, 'INSERT INTO servers (type, host, lastPing) VALUES (?, ?, ?)', [type, hostAddress, Date.now()]);
    } else {
      await rqlite.run(dbConnection, 'UPDATE servers SET lastPing = ? WHERE type = ? AND host = ?', [Date.now(), type, hostAddress]);
    }
  }

  async function syncServers (type, servers) {
    config[type + 's'] = config[type + 's'] || [];

    servers.forEach(server => {
      const withinPingLimits = Date.now() - server.lastPing < 15000;

      if (!config[type + 's'].includes(server.host) && withinPingLimits) {
        config[type + 's'].push(server.host);
        console.log(`Discovered new ${type} server in data store: [${server.host}]`);
      }

      if (config[type + 's'].includes(server.host) && !withinPingLimits) {
        const index = config[type + 's'].indexOf(server.host);
        if (index !== -1) config[type + 's'].splice(index, 1);

        console.log(`Removed ${type} server as last ping longer than 15 seconds: [${server.host}]`);
      }
    });

    config[type + 's'].forEach(serverHost => {
      if (!servers.find(server => server.host === serverHost)) {
        const index = config[type + 's'].indexOf(serverHost);
        if (index !== -1) config[type + 's'].splice(index, 1);

        console.log(`Removed ${type} server no longer in data store: [${serverHost}]`);
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
