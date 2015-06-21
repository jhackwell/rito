/**
 * Created by jay on 6/20/2015.
 */
'use strict';
var assert = require('chai').assert;
var rito = require('../rito.js');

describe('registerAlias', function () {
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
    this.rito = new rito.Client({
      api: {key: 'key', base: 'base', region: 'region'}
    });
  });

  it('should add a new route alias', function () {
    this.rito.registerAlias(
      {name: 'foo'},
      this.noErr,
      function (res) {
        assert.ok(/Added alias/.exec(res.msg))
      }
    );
  });

  it('should ignore identical collisions', function () {
    var alias = {name: 'foo', route: 'bar'};
    this.rito.registerAlias(alias, this.noErr, function () {
    });
    this.rito.registerAlias(
      alias,
      this.noErr,
      function (res) {
        assert.ok(/Duplicate alias/.exec(res.msg))
      }
    );
  })
  ;
  it('should error if a conflicting alias is attempted to be registered', function () {
    var alias = {name: 'foo', route: 'bar'};
    this.rito.registerAlias(alias, this.noErr, function () {
    });
    alias.route = 'baz';
    this.rito.registerAlias(
      alias,
      function (err) {
        assert.ok(/Attempted to register/.exec(err.msg))
      },
      function (res) {
        // Res is undefined behavior for err, so we'll ignore.
      }
    );
  });

});