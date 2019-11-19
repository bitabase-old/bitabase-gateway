const config = {
  dev: {
    port: 8082,
    secret: 'not-the-closest-kept-secret-in-the-world',
    managerUrl: 'http://localhost:8081',
    accountMapper: '(.*).bitabase.test',
    servers: [
      'http://localhost:8000'
    ]
  },

  production: {
    port: 80,
    secret: process.env.BB_INTERNAL_SECRET,
    managerUrl: 'https://api.bitabase.net',
    accountMapper: '(.*).bitabase.net',
    servers: (process.env.BB_INTERNAL_SERVERS || '').split(',').map(s => s.trim())
  }
};

module.exports = config[process.env.NODE_ENV || 'dev'];
