const fs = require('fs');
const { promisify } = require('util');
const path = require('path');

const managerServer = require('../../shared/bitabase-manager/server');
const createDataServer = require('../../shared/bitabase-server/server');
const { flushCache } = require('../../shared/bitabase-server/modules/cachableSqlite');

const rmdir = promisify(fs.rmdir);

let dataServers = [];
async function bringUp (dataServerCount = 1) {
  await managerServer.stop();
  await rmdir(path.resolve('./shared/bitabase-manager/data'), { recursive: true });
  await managerServer.start();

  for (let server = 0; server < dataServers.length; server++) {
    await dataServers[server].stop();
  }

  await rmdir(path.resolve('/tmp/data'), { recursive: true });

  for (let server = 0; server < dataServerCount; server++) {
    const currentServer = createDataServer({
      port: 8000 + server,
      databasePath: '/tmp/data/' + server
    });
    await currentServer.start();
    dataServers.push(currentServer);
  }
}

async function bringDown () {
  flushCache();

  await managerServer.stop();

  for (let server = 0; server < dataServers.length; server++) {
    await dataServers[server].stop();
  }

  dataServers = [];
}

module.exports = {
  bringUp,
  bringDown
};
