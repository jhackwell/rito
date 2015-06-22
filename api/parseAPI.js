/**
 * Created by jay on 6/21/2015.
 */

var _ = require('lodash');

parse = function (src) {
  // \r\n is the Windows line separator, while \n is *nix
// We also drop empty lines, as they'd throw off our parsing
  var lines = _.filter(src.split(/\r?\n/), function (line) {
    return line
  });
  var o = {}, endpoint, fullName, dash, version, routes, regions;

  _.forEach(lines, function (line) {
    if (line[0] !== '\t') {
      // If this line doesn't start with \t, it's the beginning of a new endpoint description.
      // Push the old one on if there's anything in it...
      if (endpoint && !_.isEmpty(endpoint) && endpoint.name) {
        o[endpoint.name] = endpoint;
        // We were only keeping these around as convenience variables
        delete(endpoint.name);
        delete(endpoint.version);
      }
      // Then start on a new one
      // fullName -- e.g. (featured-games-v.10)
      fullName = line.slice(0, line.indexOf(' ')).slice();
      dash = fullName.lastIndexOf('-');
      version = fullName.slice(dash + 2, fullName.length);
      endpoint = {
        name: fullName.slice(0, dash),
        // We assume the segment after the last dash will be 'v<version>'
        version: version
      };
      // We also assume that anything inside the first [] is a list of regions.
      regions = (line.slice(line.indexOf('[') + 1, line.indexOf(']'))).split(', ');
      endpoint[version] = {
        regions: regions,
        routes: []
      };
      // We want this reference to stuff routes into it as we iterate along.
      routes = endpoint[version].routes;
    } else {
      // We assume that everything under an endpoint follows the form:
      // \t<route>
      // \t\t<description>
      // If that isn't true, behavior here is undefined.
      if (line.slice(0, 2) !== '\t\t') {
        // Assumes a route line always starts with its first word as the route's method.
        var method = line.slice(1, line.indexOf(' '));

        // Assumes route line follows the form '<method> <route>'
        // We also switch single curly braces out for doubles for mustache to use in slug generation
        var route = (line.slice(line.indexOf(' ') + 1, line.length)).replace(/\{/g, '{{').replace(/\}/g, '}}');
        /**
         * Here's where things get a bit dicey.  We're going to generate what we're hoping will be a
         * unique name for this route, simply by removing all parameters and the version number.  This will
         * be easier to refer to when registering aliases.  The Riot API does NOT guarantee that the result of this
         * operation will be unique, however, so this is fragile and may break on changes to the API itself.
         *
         * Ex: "/api/lol/{{region}}/v1.3/game/by-summoner/{{summonerId}}/recent"
         * -> "api.lol.game.by-summoner.recent","description"
         **/
        name = route.slice(1, route.length)
          .replace(/\/\{\{.*?\}\}/g, '')
          .replace(/\/v(\d+)\.(\d+)/g, '')
          .replace(/\//g, '.');

        routes.push({method: method, route: route, name: name})
      } else {
        // We assume any line starting with \t\t is a description of the route on the previous line
        routes[routes.length - 1]['description'] = line.slice(2, line.length);
      }
    }
  });
  // The last endpoint never got pushed by the (non-existent) next line.
  o[endpoint.name] = endpoint;
  delete(endpoint.name);
  delete(endpoint.version);

  return o;
};

exports.parse = parse;


