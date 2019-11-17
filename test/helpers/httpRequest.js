const axios = require('axios')

module.exports = axios.create({
  validateStatus: status => status < 500
})
