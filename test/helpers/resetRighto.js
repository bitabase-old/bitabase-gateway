const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const righto = require('righto')

const config = require('../../config')

let managerServer = require('../../../bitabase-manager/server')
let dataServer = require('../../../bitabase-server/server')

const stopManagerServer = righto(managerServer.stop)
const removeManagerData = righto(fs.rmdir, path.resolve('../bitabase-manager/data'), {recursive: true})
const startManagerServer = righto(managerServer.start)

const stopDataServer = righto(dataServer.stop)
const removeServerData = righto(fs.rmdir, path.resolve('../bitabase-server/data'), {recursive: true})
const startDataServer = righto(dataServer.start)

const bringUp = 
  righto.reduce([
    stopManagerServer,
    removeManagerData,
    startManagerServer,

    stopDataServer,
    removeServerData,
    startDataServer
  ])

const bringDown = 
  righto.all([
    righto(managerServer.stop),
    righto(dataServer.stop)
  ])

module.exports =  {
  bringUp,
  bringDown
}
