/**
 * Created by jay on 6/20/2015.
 */

var mustache = require('mustache');
var https = require('https');
var _ = require('lodash');
var routes = require('./api/src/src.json');

var Client = function (settings) {
  this.settings = settings;

  /*
   * Main public-facing method.
   */
  this.call = function (route, err, res) {

  };

  this._buildURI = function (slug) {
    return mustache.render(
      // The ampersand in the slug is to prevent slashes from being HTML encoded
      'https://{{api.region}}.{{api.base}}/{{& slug}}?api_key={{api.key}}',
      // We render the slug through mustache so that it can access settings as well.
      _.merge({"slug": mustache.render(slug, this.settings)}, this.settings)
    );
  };

  /*
   * Get is the only method supported by the Riot API at this time,
   * and HTTPS is the only transport.
   */
  this._get = function (slug, err, res) {
    https.get(this._buildURI(slug), res).on('error', err);
  };
};

exports.Client = Client;