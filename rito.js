/**
 * Created by jay on 6/20/2015.
 */

var mustache = require('mustache');
var https = require('https');
var _ = require('lodash');

var Client = function (settings) {
  this.settings = settings;

  this.buildURI = function (slug) {
    return mustache.render(
      // The ampersand in the slug is to prevent slashes from being HTML encoded
      'https://{{api.region}}.{{api.base}}/{{& slug}}?api_key={{api.key}}',
      // We render the slug through mustache so that it can access settings as well.
      _.merge({"slug": mustache.render(slug, this.settings)}, this.settings)
    );
  };

  /*
   * Get is the only method supporting by the RIOT API at this time,
   * and HTTPS is the only transport.
   */
  // todo don't take slug, take route name or something like that
  this.get = function (slug, err, res) {
    https.get(this.buildURI(slug), res).on('error', err);
  }
};

exports.Client = Client;