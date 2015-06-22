# rito [![NPM version][npm-image]][npm-url] 
[![Build Status](https://api.travis-ci.org/jhackwell/rito.svg?branch=master)](https://travis-ci.org/jhackwell/rito)
> Flexible and durable Riot Games API client in Node.js



## Install

```sh
$ npm install --save rito
```


## Usage

```js
var _ = require('lodash');
var rito = require('./rito.js');

// These callbacks can do anything with the output streams you desire!  Obvious uses include
// propagating to a database, logging, and performing stats logging.
var res = function (res) {
  console.log(res)
};
var err = function (err) {
  console.log(err)
};

// base is in public.settings.json -- unlikely to change, but better not to hard code it.
// <key> should be replaced with your own private key.  It is recommended to put it in private.settings.json
// https is any object with the same API as the Node.js HTTPS module (this is passed in rather than hardcoded
// both for modularity and testing)
var client = new rito.Client({key: <key>, base: 'api.pvp.net'}, require('https'));

// Register the "champion" endpoint at version 1.2
// You only need to register whatever endpoints you need -- this is an ideal thing to have in your
// configuration somewhere.
//
// These are all defined in /api/generated/api.json
client.use('champion', '1.2', err, res);
client.use('lol-static-data', '1.2', err, res);

// Rather than call the rito.call() method directly (which is flexible but cumbersome), it may be easier
// to bind a set of variables to it-- this way you can configure whatever response handling and output streams
// you want, and you only have to do it in one place!
//
// Placeholders are route name, route method (e.g. GET), region, and parameters.
var call = _.bind(client.call, client, _, _, _, _, err, function (res) {
  if (res.statusCode == 200) {
    res.on('data', function (d) {
      process.stdout.write(d);
    });
  } else {
    console.log(res.statusCode)
  }
});

// You can then create whatever functions you want for convenience in your application!
var getChampionById = function (region, id) {
  call('api.lol.region.champion.id', 'GET', region, {id: id})
};

var getItemById = function (region, id) {
  call('api.lol.static-data.region.item.id', 'GET', region, {id: id})
};

getChampionById('na', 7);
getItemById('na', 3135);


```

## License

MIT

[npm-image]: https://badge.fury.io/js/rito.svg
[npm-url]: https://npmjs.org/package/rito
[travis-image]: https://travis-ci.org//rito.svg?branch=master
[travis-url]: https://travis-ci.org//rito
[daviddm-image]: https://david-dm.org//rito.svg?theme=shields.io
[daviddm-url]: https://david-dm.org//rito
