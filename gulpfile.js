'use strict';

var gulp          = require('gulp');
var gutil         = require('gulp-util');

var cryptojs      = require('crypto-js');
var marked        = require('marked');
var FileSystem    = require('fs');
var through       = require('through2');
var PluginError   = gutil.PluginError;

function forceEncryptedLayout(frontMatter) {
  var lines = frontMatter.split('\n');
  var linesWithoutLayout = [];

  lines.forEach(function(line) {
    var isLayout = line.indexOf('layout:') === 0;
    if (!isLayout) linesWithoutLayout.push(line);
  });

  var linesWithLayout = linesWithoutLayout
    .splice(0, 1)
    .concat('layout: encrypted')
    .concat(linesWithoutLayout);

  var frontMatterWithEncryptedLayout = linesWithLayout.join('\n');
  return frontMatterWithEncryptedLayout;
}

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
      var frontMatter = forceEncryptedLayout(chunks[1]);

      var encrypted = cryptojs.AES.encrypt(marked(chunks[2]), password);
      var hmac = cryptojs.HmacSHA256(encrypted.toString(), cryptojs.SHA256(password).toString()).toString();
      var encryptedMessage = 'encrypted: ' + hmac + encrypted;

      var result = [ '---', frontMatter, '\n', encryptedMessage, '\n', '---' ]

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