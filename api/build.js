/**
 * Created by jay on 6/21/2015.
 */

var fs = require('fs');
var parse = require('./parseAPI.js').parse;

fs.writeFileSync(
  './generated/api.json',
  JSON.stringify(parse(fs.readFileSync('./src/src.txt').toString('ascii')))
);
