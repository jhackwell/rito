/**
 * Created by jay on 6/20/2015.
 */
'use strict';

var mustache = require('mustache');
var _ = require('lodash');
var fs = require('fs');

/**
 * todo Description
 *
 * @param settings Configuration object.
 * @param https Either the Node.js https module, or a mock of it for testing.
 * @constructor
 */
var Client = function (settings, https) {
  this.settings = settings;
  this.aliases = settings.aliases ? settings.aliases : [];
  this.https = https;
  this.endpoints = [];

  /**
   * Specify which version of a given API endpoint this client should use.
   * This will make all methods of an endpoint available to be called, and the methods
   * will be fixed at this specific version for the rest of this object's life.
   *
   * @param endpoint
   * @param version
   * @param err
   * @param res
   */
  this.use = function (endpoint, version, err, res) {
    var add = {endpoint: endpoint, version: version};
    var match = _.find(this.endpoints, {endpoint: endpoint});

    if (match && !(match.endpoint == add.endpoint && match.version == add.version)) {
      err({
        msg: 'Could not attach endpoint ' + endpoint + ' at version ' + version + ': '
        + match.version + ' already attached'
      });
    } else if (match) {
      res({
        msg: mustache.render(
          'Attempted to attach duplicate endpoint {{endpoint}} at version {{version}}; ignoring',
          match
        )
      })
    }
    // There was no match, so we can insert the endpoint.
    else {
      if (this._api[endpoint] && this._api[endpoint][version]) {
        this.endpoints.push(add);
        // We have to bind registerRoute so it gets the right 'this' context
        // We pass through the err and res that were passed into this function, so that the caller
        // can do with them as they please.
        _.forEach(this._api[endpoint][version].routes, _.bind(this.registerRoute, this, _, err, res))
      } else {
        err({
          msg: mustache.render('Endpoint {{endpoint}} at version {{version}} does not exist in API', add)
        });
      }
    }
  }
  ;

  /**
   * Build and make a request using the given method to the HTTPS module attached
   * to this client.
   *
   * Get is the only request method supported at this time.
   *
   * @param alias Route name
   * @param method E.g. 'get'.  Must be defined on this object.
   * @param region E.g. 'na'
   * @param params Route-specific parameters, e.g. 'id'
   * @param err Error callback
   * @param res Success callback
   *
   * todo add check for region availability here
   */
  this.call = function (alias, method, region, params, err, res) {
    method = '_' + method;
    if (!this.https) {
      throw new Error('Rito client has no HTTPS module attached to it')
    }
    if (this.hasOwnProperty(method) && _.isFunction(this[method])) {
      // Key and base never change per client instance, and are only decoupled
      // for testing.  We just merge region in here and pass it along.
      settings = _.merge({"region": region}, this.settings);
      // Now it's just a simple matter of rendering the slug and shooting it at Rito.
      this[method](this._buildURI((this._buildSlug(alias, params)), settings), err, res);
    } else {
      throw new Error('Request method ' + method + 'is undefined or is not callable');
    }
  };

  /**
   * Register a route under an alias that will then become available for calling.
   *
   * @param alias
   * @param err Error callback
   * @param res Result callback
   */
  this.registerRoute = function (alias, err, res) {
    var existing = _.find(this.aliases, function (oldAlias) {
      return oldAlias.name == alias.name
    });
    if (!existing) {
      // We clone this rather than just pushing it on because the referent may have
      // been previously added but later mutated at some point.
      this.aliases.push(_.clone(alias));
      res({msg: mustache.render('Added alias for name {{name}}', alias)})
    } else {
      if (existing.route == alias.route) {
        res({msg: mustache.render('Duplicate alias added with name {{name}}; ignoring', alias)})
      } else {
        err(
          {
            msg: mustache.render('Attempted to register alias with conflicting route', alias),
            details: {alias: alias, existing: existing}
          });
      }
    }
  };

  /**
   * Simple wrapper around node HTTPS.
   * Get is the only method supported by the Riot API at this time.
   *
   * @param route
   * @param err
   * @param res
   * @private
   */
  this._get = function (route, err, res) {
    https.get(route, res).on('error', err)
  };

  /**
   * Load in JSON API description at construction time.
   */
  this._api = function () {
    var parsed = JSON.parse(fs.readFileSync('./api/generated/api.json').toString());
    if (!parsed) {
      throw new Error('Unable to parse API description from JSON')
    } else {
      return parsed;
    }
  }();

  /**
   * Build an endpoint URI given an endpoint short name.
   *
   * Helper method.
   *
   * @param slug
   * @param settings Must include 'region', 'base', 'key'
   * @returns {*}
   * @private
   */
  this._buildURI = function (slug, settings) {
    var missing = _.difference(['region', 'base', 'key'], _.keys(settings));
    if (!missing.length) {
      slug = slug[0] === '/' ? slug : '/' + slug;
      return mustache.render(
        // The ampersand in the slug is to prevent slashes from being HTML encoded
        // HTTPS is hardcoded as it's the only transport available at this time
        'https://{{region}}.{{base}}{{& slug}}?api_key={{key}}',
        // We render the slug through mustache so that it can access settings as well.
        _.merge({"slug": mustache.render(slug, this.settings)}, settings)
      );
    } else {
      throw new Error('Missing required API parameters for _buildURI: ' + missing)
    }
  };

  /**
   * Build slug from previously-registered route alias and params.
   * Any slug with stuff in it that might get HTML encoded bug shouldn't, like
   * '{{something/else}}' will need to be represented as {{& something/else}}
   *
   * Helper method.
   *
   * @param alias String Name of a previously-registered alias
   * @param params Object Key-value pairs of parameter names and values
   * @private
   */
  this._buildSlug = function (alias, params) {
    var route = _.find(this.aliases, function (existing) {
      return existing.name == alias
    });

    if (route) {
      // We have an alias, which means we can extract from it the parameters it needs
      // and substitute in the parameters we were given
      var missing = _.difference(route.params, _.keys(params));
      if (!missing.length) {
        // We have a route, and we have all its parameters, so we can replace
        // tags with params.
        return mustache.render(route.route, params);
      } else {
        throw new Error('Missing parameters for route ' + alias + ': ' + missing)
      }
    } else {
      throw new Error('Attempted to call unregistered alias with name ' + alias)
    }
  };
};

exports.Client = Client;