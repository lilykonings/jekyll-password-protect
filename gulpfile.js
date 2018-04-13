'use strict';

var gulp          = require('gulp');
var gutil         = require('gulp-util');

var cryptojs      = require('crypto-js');
var marked        = require('marked');
var FileSystem    = require('fs');
var through       = require('through2');
var PluginError   = gutil.PluginError;

function encrypt(password) {
  return through.obj(function(file, encoding, callback) {
    if (file.isNull() || file.isDirectory()) {
      this.push(file);
      return callback();
    }

    // No support for streams
    if (file.isStream()) {
      this.emit('error', new PluginError({
        plugin: 'Encrypt',
        message: 'Streams are not supported.'
      }));
      return callback();
    }

    if (file.isBuffer()) {
      var chunks = String(file.contents).split('---');

      var encrypted = cryptojs.AES.encrypt(marked(chunks[2]), password);
      var hmac = cryptojs.HmacSHA256(encrypted.toString(), cryptojs.SHA256(password).toString()).toString();
      var encryptedMessage = 'encrypted: ' + hmac + encrypted;

      var result = [ '---', chunks[1], '\n', encryptedMessage, '\n', '---' ]

      file.contents = new Buffer(result.join(''));
      this.push(file);
      return callback();
    }
  });
}

gulp.task('encrypt', () => {
  return gulp.src('_protected/*.*')
    .pipe(encrypt('password'))
    .pipe(gulp.dest('_posts'));
});

gulp.task('watch', () => {
  gulp.watch('_protected/*.*', ['encrypt']);
});

gulp.task('default', ['encrypt', 'watch'], () => {});