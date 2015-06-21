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
var chai = require('chai'),
  assert = chai.assert,
  should = chai.should(),
  expect = chai.expect,
  spies = require('chai-spies');

chai.use(spies);

// Convenience method for generating spies that assert the res/err message
// matches a particular string
var regexSpy = function (str) {
  return chai.spy(function (res) {
      var re = new RegExp(str);
      assert.ok(re.exec(res.msg))
    }
  )
};

describe('registerAlias', function () {
  beforeEach(function () {
    this.rito = new rito.Client({
      api: {key: 'key', base: 'base', region: 'region'},
      https: {}
    });
  });

  it('should add a new route alias', function () {
    var errSpy = chai.spy();
    var addedSpy = regexSpy('Added alias');

    this.rito.registerAlias({name: 'foo'}, errSpy, addedSpy);

    addedSpy.should.have.been.called.once();
    errSpy.should.not.have.been.called();
  });

  it('should ignore identical collisions', function () {
    var errSpy = chai.spy();
    var resSpy = chai.spy();
    var dupSpy = regexSpy('Duplicate alias');

    // We should get success the first time...
    var alias = {name: 'foo', route: 'bar'};
    this.rito.registerAlias(alias, errSpy, resSpy);

    // and success with warning message about duplication here
    this.rito.registerAlias(alias, errSpy, dupSpy);

    resSpy.should.have.been.called.once();
    dupSpy.should.have.been.called.once();
    errSpy.should.not.have.been.called();
  });

  it('should error if a conflicting alias is attempted to be registered', function () {
    var errSpy = regexSpy('Attempted to register');
    var resSpy = chai.spy();

    // We should get success the first time...
    var alias = {name: 'foo', route: 'bar'};
    this.rito.registerAlias(alias, errSpy, resSpy);

    // And an error the second time.
    alias.route = 'baz';
    this.rito.registerAlias(alias, errSpy, resSpy);

    errSpy.should.have.been.called.once();
    resSpy.should.have.been.called.once();
  });
});

describe('_buildSlug', function () {
  beforeEach(function () {
    this.rito = new rito.Client({
      api: {key: 'key', base: 'base', region: 'region'},
      https: {}
    });
  });

  it('should error if an attempt is made to transform an unregistered route', function () {
    var errSpy = regexSpy('Attempted to call');
    this.rito._buildSlug('foo', {}, errSpy, _.noop);
    errSpy.should.have.been.called();
  });

  it('should error if required parameters are missing', function () {
    var errSpy = regexSpy('Missing parameters');

    this.rito.registerAlias({name: 'foo', route: '{{bar}}', params: ['bar', 'baz']}, _.noop, _.noop);
    this.rito._buildSlug('foo', {'bar': 'bat'}, errSpy, _.noop);

    errSpy.should.have.been.called();
  });

  it('should replace tags with params', function () {
    var errSpy = chai.spy();

    this.rito.registerAlias({name: 'foo', route: '{{bar}}/{{baz}}', params: ['bar', 'baz']}, _.noop, _.noop);
    this.rito._buildSlug('foo', {'bar': 'bat', 'baz': 'qux'}, errSpy, function (res) {
      assert.ok(res.slug);
      assert.equal(res.slug, 'bat/qux');
    });

    errSpy.should.not.have.been.called();
  });

});