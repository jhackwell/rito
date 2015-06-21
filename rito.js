/**
 * Created by jay on 6/20/2015.
 */

var mustache = require('mustache');
var _ = require('lodash');

var Client = function (settings) {
  this.settings = settings;

  this.buildURI = function (slug) {
    return mustache.render(
      '{{api.transport}}://{{api.region}}.{{api.base}}/{{slug}}?api_key={{api.key}}',
      _.merge({"slug": slug}, this.settings)
    );
  };
};

exports.Client = Client;