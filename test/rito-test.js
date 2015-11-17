/**
 * Created by jay on 6/20/2015.
 */
'use strict';

// Hey, that's us!
var rito = require('../rito.js');
var _ = require('lodash');

// A bunch of Chai stuff.
// Webstorm detects 'should' and 'expect' as unused, but they're actually necessary
// for demeter chained spy assertions.
//noinspection JSUnusedGlobalSymbols
//var chai = require('chai'),
//  assert = chai.assert,
//  should = chai.should(),
//  expect = chai.expect,
//  spies = require('chai-spies');

//chai.use(spies);

// Convenience method for generating spies that assert the res/err message
// matches a particular string
//var regexSpy = function (str) {
//  return chai.spy(function (res) {
//      assert.ok(new RegExp(str).exec(res.msg))
//    }
//  )
//};

describe('registerRoute', function () {
  before(function () {
    this.noErr = function (err) {
      // This way we get the error message in the Mocha logs if the
      // assertion fails.
      if (err) {
        assert.notOk(err.msg)
      }
    };
  });

  beforeEach(function () {
    this.rito = new rito.Client({}, {});
  });

  it('should add a new route alias', function () {
  });
});
