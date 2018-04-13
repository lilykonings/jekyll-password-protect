'use strict';

var gulp          = require('gulp');
var gutil         = require('gulp-util');

var cryptojs      = require('crypto-js');
var marked        = require('marked');
var FileSystem    = require('fs');
var through       = require('through2');
var PluginError   = gutil.PluginError;

var password = 'password';

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

/*
 * Check if password is at least 12 characters long for a good measure.
 *
 * Source: https://www.betterbuys.com/estimating-password-cracking-times/
 */
gulp.task('check-password', function() {
  if (!password || password.length < 12) {
    var message = [
      'Please use a password at least 12 characters long.',
      'Otherwise, an attacker might download your files and brute force the password locally.',
      'See https://www.betterbuys.com/estimating-password-cracking-times/ for more info.'
    ];
    this.emit('error', new PluginError({
      plugin: 'Encrypt',
      message: message.join('\n    ')
    }));
  }
});

gulp.task('encrypt', ['check-password'], () => {
  return gulp.src('_protected/*.*')
    .pipe(encrypt(password))
    .pipe(gulp.dest('_posts'));
});

gulp.task('watch', () => {
  gulp.watch('_protected/*.*', ['encrypt']);
});

gulp.task('default', ['encrypt', 'watch'], () => {});