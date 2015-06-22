/**
 * Created by jay on 6/21/2015.
 */
'use strict';

var chai = require('chai'),
  assert = chai.assert;
var fs = require('fs');

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
});