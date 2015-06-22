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
    //noinspection JSAccessibilityCheck
    expect(this.rito._buildSlug.bind(this.rito, 'foo', {})).to.throw(/Attempted to call unregistered alias/);
  });

  it('should error if required parameters are missing', function () {
    this.rito.registerAlias({name: 'foo', route: '{{bar}}', params: ['bar', 'baz']}, _.noop, _.noop);
    //noinspection JSAccessibilityCheck
    expect(this.rito._buildSlug.bind(this.rito, 'foo', {'bar': 'bat'})).to.throw(/Missing parameters/);
  });

  it('should replace tags with params', function () {
    this.rito.registerAlias({name: 'foo', route: '{{bar}}/{{baz}}', params: ['bar', 'baz']}, _.noop, _.noop);
    //noinspection JSAccessibilityCheck
    var slug = this.rito._buildSlug('foo', {'bar': 'bat', 'baz': 'qux'});
    assert.equal('bat/qux', slug)
  });
});

describe('_buildURI', function () {
  beforeEach(function () {
    this.rito = new rito.Client({
      api: {key: 'key', base: 'base', region: 'region'},
      https: {}
    });
  });

  it('should error if required parameters are missing', function () {
    //noinspection JSAccessibilityCheck
    expect(this.rito._buildURI.bind(this.rito, '', {})).to.throw(/Missing required API parameters/);
  });

  it('should replace tags with params', function () {
    //noinspection JSAccessibilityCheck
    var URI = this.rito._buildURI('slug', {'region': 'region', 'base': 'base', 'key': 'key'});
    assert.equal('https://region.base/slug?api_key=key', URI);
  });

  it('should pad the start of the slug with a slash if it does not exist', function () {
    //noinspection JSAccessibilityCheck
    var URI = this.rito._buildURI('/rito/pls/fix', {'region': 'region', 'base': 'base', 'key': 'key'});
    assert.equal('https://region.base/rito/pls/fix?api_key=key', URI);

    //noinspection JSAccessibilityCheck
    URI = this.rito._buildURI('rito/pls/fix', {'region': 'region', 'base': 'base', 'key': 'key'});
    assert.equal('https://region.base/rito/pls/fix?api_key=key', URI);
  });

  it('should not HTML encode the slug', function () {
    //noinspection JSAccessibilityCheck
    var URI = this.rito._buildURI('rito/pls/fix', {'region': 'region', 'base': 'base', 'key': 'key'});
    assert.equal('https://region.base/rito/pls/fix?api_key=key', URI);
  });
});