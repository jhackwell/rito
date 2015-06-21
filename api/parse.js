/**
 * Created by jay on 6/20/2015.
 */

var fs = require('fs');
var src = fs.readFileSync('./src/src.html').toString();

a = /push/.exec(src);
console.log(a);