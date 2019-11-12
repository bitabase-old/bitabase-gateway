const fs = require('fs')
const {promisify} = require('util')
const path = require('path')
const mkdirp = require('mkdirp')
const righto = require('righto')

const config = require('../../config')

let managerServer = require('../../../bitabase-manager/server')
let dataServer = require('../../../bitabase-server/server')

const rmdir = promisify(fs.rmdir)

async function bringUp () {
  await managerServer.stop()
  await rmdir(path.resolve('../bitabase-manager/data'), {recursive: true})
  await managerServer.start()

  await dataServer.stop()
  await rmdir(path.resolve('../bitabase-server/data'), {recursive: true})
  await dataServer.start()
}

async function bringDown () {
  await managerServer.stop()
  await dataServer.stop()
}

module.exports =  {
  bringUp,
  bringDown
}
