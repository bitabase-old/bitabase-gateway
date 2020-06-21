# bitabase - Gateway
[![Build Status](https://travis-ci.org/bitabase/bitabase-gateway.svg?branch=master)](https://travis-ci.org/bitabase/bitabase-gateway)
[![David DM](https://david-dm.org/bitabase/bitabase-gateway.svg)](https://david-dm.org/bitabase/bitabase-gateway)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/bitabase/bitabase-gateway)
[![GitHub package.json version](https://img.shields.io/github/package-json/v/bitabase/bitabase-gateway)](https://github.com/bitabase/bitabase-gateway/blob/master/package.json)
[![GitHub](https://img.shields.io/github/license/bitabase/bitabase-gateway)](https://github.com/bitabase/bitabase-gateway/blob/master/LICENSE)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/standard/semistandard)

This is a very early attempt at the gateway server.

## Getting Started
### From the CLI
Running the following:
```bash
npm install --global bitabase-gateway
bitabase-gateway --help
```

Will output the below:
```bash
📦 Bitabase-Gateway - v1.5.1
The scalable, sharded database engine.
https://docs.bitabase.com

The following commands and arguments are available when starting Bitabase

Commands:
  start                            Start the bitabase gateway stack
    --bind-host                    Hostname to bind server to (default: 0.0.0.0)
    --bind-port                    Port to bind server to (default: 8001)
    --rqlite-addr                  Path to contact rqlite
    --secret                       The internal request secret
    --account-mapper               The regex to take the account from the incoming host (default: (.*).bitabase.test)

No command specified
```

You can start a bitabase gateway server by running:

```bash
bitabase-gateway start
```

### From NodeJS
```javascript
const bitabaseServer = require('bitabase-gateway/server');

const server = bitabasegateway({
  bindHost: '0.0.0.0'
});

server.start();
```

## Endpoints

All requests are proxied through to the database servers based on the
database stored in the hostname:

https://:databaseName.bitabase.com

<table>
  <tr>
    <th></th>
    <th>Method</th>
    <th>Path</th>
    <th>Description</th>
  </tr>
  <tr>
    <td colspan=4>
      <strong>Records</strong></br>
      Records are stored in a collection and must adhere to the schema
    </td>
  </tr>
  <tr>
    <td><a href="https://www.github.com/bitabase/bitabase-gateway">1.1</a></td>
    <td>GET</td>
    <td>/:collectionId</td>
    <td>Search through records</td>
  </tr>
</table>

## License
This project is licensed under the terms of the AGPL-3.0 license.
