/**
 * Created by jay on 6/21/2015.
 */
'use strict';

var chai = require('chai'),
  assert = chai.assert;
var fs = require('fs');
var _ = require('lodash');

// Hey, that's us!
var parse = require('../api/parseAPI.js').parse;

describe('parseAPI', function () {
  it('should match the snapshot version', function () {
    // Since the current usage of the parser is to manually generate a JSON snapshot
    // from the API description text snapshot, we just want to do an end-to-end test here
    // for now.  This is effectively a regression test.
    var out = JSON.stringify(parse(fs.readFileSync('./api/fixture/parseAPI-snapshot.txt').toString()));
    var snapshot = fs.readFileSync('./api/fixture/parseAPI-snapshot.json').toString();
    assert.equal(out, snapshot);
  });

  it('should not create duplicate route names', function () {
    // Since the current usage of the parser is to manually generate a JSON snapshot
    // from the API description text snapshot, we just want to do an end-to-end test here
    // for now.  This is effectively a regression test.
    var api = parse(fs.readFileSync('./api/fixture/parseAPI-snapshot.txt').toString());

    var names = [];
    _.forEach(api, function(endpoint) {
      // We're going to make sure there are no duplicate names using the most recent
      // version of all routes.
      // todo This could potentially leave room for conflict between different routes
      // todo in the situation where not all are using the most recent version
      var versionId = _.keys(endpoint)[0];
      _.forEach(endpoint[versionId].routes, function(route) {
        names.push(route.name)
      })
    });

    // The set of unique names should be the same as the set of all names
    assert.equal(0, _.difference(names, _.uniq(names)).length);
  });
});