/**
 * Created by jay on 6/20/2015.
 */
'use strict';

var mustache = require('mustache');
var _ = require('lodash');

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

  /**
   * Call a previously-registered alias for a fully-qualified, versioned route endpoint.
   *
   * @param alias
   * @param err Error callback
   * @param res Result callback
   */
  this.registerAlias = function (alias, err, res) {
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
   *
   * @param alias
   * @param method
   * @param params
   * @param err
   * @param res
   */
  this.call = function (alias, method, params, err, res) {

  };

  /**
   * Build slug from previously-registered route alias and params.
   * Any slug with stuff in it that might get HTML encoded bug shouldn't, like
   * '{{something/else}}' will need to be represented as {{& something/else}}
   *
   * @param alias String Name of a previously-registered alias
   * @param params Object Key-value pairs of parameter names and values
   * @param err Error callback
   * @param res Result callback
   */
  this._buildSlug = function (alias, params, err, res) {
    var route = _.find(this.aliases, function (existing) {
      return existing.name == alias
    });

    if (route) {
      // We have an alias, which means we can extract from it the parameters it needs
      // and substitute in the parameters we were given
      var missing = _.difference(route.params, _.keys(params));
      if (missing.length) {
        err({
            msg: 'Missing parameters for aliased route ' + alias,
            details: {alias: alias, missing: missing}
          }
        )
      } else {
        // We have a route, and we have all its parameters.  Now it's just a simple
        // matter of rendering the slug and shooting it at Rito.
        res({slug: mustache.render(route.route, params)});
      }
    } else {
      console.log('here is the error');
      err({msg: 'Attempted to call unregistered alias with name ' + alias})
    }
  };

  /**
   * Simple wrapper around node HTTPS.
   * Get is the only method supported by the Riot API at this time,
   * and HTTPS is the only transport.
   *
   * @param slug
   * @param err
   * @param res
   * @private
   */
  this._get = function (slug, err, res) {
    https.get(this._buildURI(slug), res).on('error', err);
  };

  /**
   * Build an endpoint URI given an endpoint short name.
   *
   * @param slug
   * @returns {*}
   * @private
   */
  this._buildURI = function (slug) {
    return mustache.render(
      // The ampersand in the slug is to prevent slashes from being HTML encoded
      'https://{{api.region}}.{{api.base}}/{{& slug}}?api_key={{api.key}}',
      // We render the slug through mustache so that it can access settings as well.
      _.merge({"slug": mustache.render(slug, this.settings)}, this.settings)
    );
  };
};

exports.Client = Client;