'use strict';
var path = require('path');
var gulp = require('gulp');
var mocha = require('gulp-mocha');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var istanbul = require('gulp-istanbul');
var plumber = require('gulp-plumber');

var handleErr = function (err) {
  console.log(err.message);
  process.exit(1);
};

gulp.task('pre-test', function () {
  return gulp.src(['api/parseAPI.js', 'rito.js'])
    .pipe(istanbul({includeUntested: true}))
    .pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], function (cb) {
  var mochaErr;

  gulp.src('test/**/*.js')
    .pipe(plumber())
    .pipe(mocha({reporter: 'spec'}))
    .on('error', function (err) {
      mochaErr = err;
    })
    .pipe(istanbul.writeReports())
    .on('end', function () {
      cb(mochaErr);
    });
});


gulp.task('default', ['test']);
