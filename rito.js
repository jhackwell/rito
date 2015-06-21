/**
 * Created by jay on 6/20/2015.
 */

var settings = require('./lib/config.js').settings;

var client = function(region, key, base) {
  this.region = region;
  this.key = key;
  this.base = base;
};

exports.client = new client(settings.api.region, settings.api.key, settings.api.base);