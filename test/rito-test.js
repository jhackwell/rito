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
      assert.ok(new RegExp(str).exec(res.msg))
    }
  )
};

describe('registerRoute', function () {
  beforeEach(function () {
    this.rito = new rito.Client({}, {});
  });

  it('should add a new route alias', function () {
    var errSpy = chai.spy();
    var addedSpy = regexSpy('Added alias');

    this.rito.registerRoute({name: 'foo'}, errSpy, addedSpy);

    addedSpy.should.have.been.called.once();
    errSpy.should.not.have.been.called();
  });

  it('should ignore identical collisions', function () {
    var errSpy = chai.spy();
    var resSpy = chai.spy();
    var dupSpy = regexSpy('Duplicate alias');

    // We should get success the first time...
    var alias = {name: 'foo', route: 'bar'};
    this.rito.registerRoute(alias, errSpy, resSpy);

    // and success with warning message about duplication here
    this.rito.registerRoute(alias, errSpy, dupSpy);

    resSpy.should.have.been.called.once();
    dupSpy.should.have.been.called.once();
    errSpy.should.not.have.been.called();
  });

  it('should error if a conflicting alias is attempted to be registered', function () {
    var errSpy = regexSpy('Attempted to register');
    var resSpy = chai.spy();

    // We should get success the first time...
    var alias = {name: 'foo', route: 'bar'};
    this.rito.registerRoute(alias, errSpy, resSpy);

    // And an error the second time.
    alias.route = 'baz';
    this.rito.registerRoute(alias, errSpy, resSpy);

    errSpy.should.have.been.called.once();
    resSpy.should.have.been.called.once();
  });
});

describe('_buildSlug', function () {
  beforeEach(function () {
    this.rito = new rito.Client({}, {});
  });

  it('should error if an attempt is made to transform an unregistered route', function () {
    //noinspection JSAccessibilityCheck
    expect(this.rito._buildSlug.bind(this.rito, 'foo', {})).to.throw(/Attempted to call unregistered alias/);
  });

  it('should error if required parameters are missing', function () {
    this.rito.registerRoute({name: 'foo', route: '{{bar}}', params: ['bar', 'baz']}, _.noop, _.noop);
    //noinspection JSAccessibilityCheck
    expect(this.rito._buildSlug.bind(this.rito, 'foo', {'bar': 'bat'})).to.throw(/Missing parameters/);
  });

  it('should replace tags with params', function () {
    this.rito.registerRoute({name: 'foo', route: '{{bar}}/{{baz}}', params: ['bar', 'baz']}, _.noop, _.noop);
    //noinspection JSAccessibilityCheck
    var slug = this.rito._buildSlug('foo', {'bar': 'bat', 'baz': 'qux'});
    assert.equal('bat/qux', slug)
  });
});

describe('_buildURI', function () {
  beforeEach(function () {
    this.rito = new rito.Client({}, {});
    this.settings = {'region': 'region', 'base': 'base', 'key': 'key'};
  });

  it('should error if required parameters are missing', function () {
    //noinspection JSAccessibilityCheck
    expect(this.rito._buildURI.bind(this.rito, '', {})).to.throw(/Missing required API parameters/);
  });

  it('should replace tags with params', function () {
    //noinspection JSAccessibilityCheck
    var URI = this.rito._buildURI('slug', this.settings);
    assert.equal('https://region.base/slug?api_key=key', URI);
  });

  it('should pad the start of the slug with a slash if it does not exist', function () {
    //noinspection JSAccessibilityCheck
    var URI = this.rito._buildURI('/rito/pls/fix', this.settings);
    assert.equal('https://region.base/rito/pls/fix?api_key=key', URI);

    //noinspection JSAccessibilityCheck
    URI = this.rito._buildURI('rito/pls/fix', this.settings);
    assert.equal('https://region.base/rito/pls/fix?api_key=key', URI);
  });

  it('should not HTML encode the slug', function () {
    //noinspection JSAccessibilityCheck
    var URI = this.rito._buildURI('rito/pls/fix', this.settings);
    assert.equal('https://region.base/rito/pls/fix?api_key=key', URI);
  });
});

describe('call', function () {
  beforeEach(function () {
    this.rito = new rito.Client(
      {base: 'base', key: 'key'},
      {
        get: chai.spy(function () {
          // We don't check to see if on() is called, so we don't need to spy on it.
          return {on: _.noop}
        })
      }
    );
  });

  it('should error if no https is attached', function () {
    delete(this.rito.https);
    expect(this.rito.call.bind(this.rito)).to.throw(/no HTTPS module/);
  });

  it('should error if request method does not exist', function () {
    // Just in case this is defined, for some reason
    delete(this.rito.post);
    expect(this.rito.call.bind(this.rito, 'foo', 'post')).to.throw(/undefined or is not callable/);
    this.rito.https.get.should.not.have.been.called();
  });

  it('should call the request method if valid', function () {
    // Just in case this is defined, for some reason
    this.rito.registerRoute({name: 'foo', route: '{{bar}}/{{baz}}', params: ['bar', 'baz']}, _.noop, _.noop);
    this.rito.call('foo', 'get', 'na', {bar: 'bat', baz: 'qux'});
    this.rito.https.get.should.have.been.called.once();
  });
});

describe('use', function () {
  beforeEach(function () {
    this.rito = new rito.Client({}, {});
  });

  it('should register a new endpoint if it does not conflict with another', function () {
    var errSpy = chai.spy(function (err) {
      console.log(err)
    });
    var resSpy = chai.spy();

    this.rito.use('champion', '1.2', errSpy, resSpy);
    assert(_.find(this.rito.endpoints, {endpoint: 'champion', version: '1.2'}));

    // However many routes there were, they all should have been inserted
    assert.equal(this.rito.aliases.length, this.rito._api.champion[1.2].routes.length);

    errSpy.should.not.have.been.called();
    resSpy.should.have.been.called();
  });

  it('should not error if the same endpoint is attached twice', function () {
    var errSpy = chai.spy();
    var resSpy = regexSpy('Attempted to attach duplicate');

    this.rito.use('champion', '1.2', _.noop, _.noop);
    this.rito.use('champion', '1.2', errSpy, resSpy);

    errSpy.should.not.have.been.called();
    resSpy.should.have.been.called.once();
  });

  it('should error if a conflicting endpoint is attached', function () {
    var errSpy = regexSpy('already attached');
    var resSpy = chai.spy();

    this.rito.use('champion', '1.2', _.noop, _.noop);
    this.rito.use('champion', '1.3', errSpy, resSpy);

    errSpy.should.have.been.called.once();
    resSpy.should.not.have.been.called();
  });
});

describe('_mergeRegions', function () {
  beforeEach(function () {
    this.rito = new rito.Client({}, {});
  });

  // One of those instances where the test is nearly identical to the method
  // ... but... regression testing, I guess?
  it('should merge the region list into each route', function () {
    //noinspection JSAccessibilityCheck
    var merged = this.rito._mergeRegions(this.rito._api);
    _.forEach(merged, function(endpoint) {
      _.forEach(endpoint, function(version) {
        var regions = version.regions;
        _.forEach(version.routes, function(route) {
          assert.equal(regions, route.regions)
        })
      })
    })
  });
});

