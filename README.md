# bitabase - Gateway
[![David DM](https://david-dm.org/bitabase/bitabase-gateway.svg)](https://david-dm.org/bitabase/bitabase-gateway)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/bitabase/bitabase-gateway)
[![GitHub package.json version](https://img.shields.io/github/package-json/v/bitabase/bitabase-gateway)](https://github.com/bitabase/bitabase-gateway/blob/master/package.json)
[![GitHub](https://img.shields.io/github/license/bitabase/bitabase-gateway)](https://github.com/bitabase/bitabase-gateway/blob/master/LICENSE)

This is a very early attempt at the gateway server.

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
