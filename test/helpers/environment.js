const fs = require('fs')
const {promisify} = require('util')
const path = require('path')
const mkdirp = require('mkdirp')
const righto = require('righto')

const config = require('../../config')

let managerServer = require('../../shared/bitabase-manager/server')
let createDataServer = require('../../shared/bitabase-server/server')

const rmdir = promisify(fs.rmdir)

let dataServers = []
async function bringUp (dataServerCount=1) {
  await managerServer.stop()
  await rmdir(path.resolve('../bitabase-manager/data'), {recursive: true})
  await managerServer.start()

  for (let server = 0; server < dataServers.length; server++) {
    await dataServers[server].stop()
  }

  await rmdir(path.resolve('/tmp/data'), {recursive: true})

  for (let server = 0; server < dataServerCount; server++) {
    const currentServer = createDataServer({
      port: 8000 + server,
      databasePath: '/tmp/data/' + server
    })
    await currentServer.start()
    dataServers.push(currentServer)
  }
}

async function bringDown () {
  await managerServer.stop()

  for (let server = 0; server < dataServers.length; server++) {
    await dataServers[server].stop()
  }
}

module.exports =  {
  bringUp,
  bringDown
}
