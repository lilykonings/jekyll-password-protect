'use strict';

var gulp          = require('gulp');
var gutil         = require('gulp-util');

var cryptojs      = require('crypto-js');
var marked        = require('marked');
var FileSystem    = require('fs');
var through       = require('through2');
var PluginError   = gutil.PluginError;

function checkEncryptedLayout(frontMatter, filepath) {
  var lines = frontMatter.split('\n'),
      linesWithoutLayout = [],
      hasEncryptedLayout = false;

  lines.forEach(function(line) {
    var layoutTag = 'layout:',
        isLayoutIndex = line.indexOf(layoutTag),
        isLayout = isLayoutIndex >= 0,
        isEncryptedLayout = line.indexOf('encrypted') >= (isLayoutIndex + layoutTag.length);

    if (isLayout) {
      // in case of multiple instances of layout
      hasEncryptedLayout = isEncryptedLayout ? true : false;
    }
  });

  if (!hasEncryptedLayout) {
    console.log('[WARNING] ' + filepath + ': protected post not using encrypted layout.');
  }

  // var linesWithLayout = linesWithoutLayout
  //   .splice(0, 1)
  //   .concat('layout: encrypted')
  //   .concat(linesWithoutLayout);

  // var frontMatterWithEncryptedLayout = linesWithLayout.join('\n');
  // return frontMatterWithEncryptedLayout;
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
      var frontMatter = checkEncryptedLayout(chunks[1], file.path);

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