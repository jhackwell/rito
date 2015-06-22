# rito [![npm-version][npm-image]][npm-url] 
[![Build Status](https://api.travis-ci.org/jhackwell/rito.svg?branch=master)](https://travis-ci.org/jhackwell/rito)
> Flexible, durable, asynchronous Riot Games API client in Node.js



## Install

```sh
$ npm install --save rito
```


## Usage

Scope it on in...
```js
var rito = require('./rito.js');
```

Then create an instance with immutable configuration.

The url base is unlikely to change (currently `api.pvp.net`), but better not to hard code it.
`<key>` should be replaced with your own private key.  It is recommended to put it in private.settings.json.
`https` is any object with the same API as the Node.js `https` module (this is passed in rather than hardcoded
both for modularity and testing)
```js
var client = new rito.Client({key: <key>, base: 'api.pvp.net'}, require('https'));
```

Register an endpoint at a specific version -- this ensures you'll always know which version of which
endpoint your application depends on!

You only need to register whatever endpoints you need -- this is an ideal thing to have in your
configuration somewhere.

All endpoints and their associated routes are defined in /api/generated/api.json
```js
client.use('champion', '1.2', err, res);
```

```console
{ msg: 'Added alias for name api.lol.region.champion' }
{ msg: 'Added alias for name api.lol.region.champion.id' }
```

Create callbacks to do anything with the output streams you desire!  Obvious uses include
propagating to a database, logging, and sending messages to [statsd](https://github.com/etsy/statsd).
```js
var res = function (res) {
  console.log(res)
};
var err = function (err) {
  console.log(err)
};
```

Rather than call the `rito.call()` method directly (which is flexible but cumbersome), it may be easier
to bind a set of variables to it-- this way you can configure whatever response handling and output streams
you want, and you only have to do it in one place!
```js
var _ = require('lodash');

//Placeholders are route name, route method (e.g. GET), region, and parameters.
var call = _.bind(client.call, client, _, _, _, _, err, function (res) {
  if (res.statusCode == 200) {
    res.on('data', function (d) {
      process.stdout.write(d);
    });
  } else {
    console.log(res.statusCode)
  }
});
```

You can then create whatever functions you want for convenience in your application!
```js
var getChampionById = function (region, id) {
  call('api.lol.region.champion.id', 'GET', region, {id: id})
};
```

And then the fun part...
```js
getChampionById('na', 7);
```

```json
{
  "id": 7,
  "active": true,
  "botEnabled": false,
  "freeToPlay": false,
  "botMmEnabled": false,
  "rankedPlayEnabled": true
}
```

## License

MIT

[npm-version]: 0.1.2
[npm-image]: https://badge.fury.io/js/rito.svg
[npm-url]: https://npmjs.org/package/rito
[travis-image]: https://travis-ci.org//rito.svg?branch=master
[travis-url]: https://travis-ci.org//rito
[daviddm-image]: https://david-dm.org//rito.svg?theme=shields.io
[daviddm-url]: https://david-dm.org//rito
