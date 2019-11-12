const httpRequest = require('./httpRequest')
const config = require('../../config')

const createUser = (user) =>
  httpRequest('/v1/users', {
    baseURL: config.managerUrl,
    method: 'post',
    data: user || {
      email: 'test@example.com',
      password: 'password'
    }
  })

const createSession = (user) =>
  httpRequest('/v1/sessions', {
    baseURL: config.managerUrl,
    method: 'post',
    data: {
      email: 'test@example.com',
      password: 'password'
    }
  })

const createUserAndSession = async () => {
  await createUser()
  const session = await createSession()
  return {
    asHeaders: {
      'X-Session-Id': session.data.sessionId,
      'X-Session-Secret': session.data.sessionSecret
    },
    ...session.data
  }
}

module.exports = {
  createUser,
  createSession,
  createUserAndSession
}
