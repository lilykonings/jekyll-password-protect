'use strict';

var gulp          = require('gulp');
var gutil         = require('gulp-util');

var cryptojs      = require('crypto-js');
var marked        = require('marked');
var FileSystem    = require('fs');
var through       = require('through2');
var PluginError   = gutil.PluginError;

/*
  START FIREWALL TASKS
*/
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
    console.log('[WARNING] ' + filepath + ': protected file not using encrypted layout.');
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
      var delimiter = '---',
          chunks = String(file.contents).split(delimiter),
          originalBody = chunks[0],
          frontMatter = '';

      if (chunks.length === 3) {
        checkEncryptedLayout(chunks[1], file.path);
        frontMatter = chunks[1];
        originalBody = chunks[2];
      } else if (chunks.length > 1) {
        this.emit('error', new PluginError({
          plugin: 'Encrypt',
          message: file.path + ': protected file has invalid front matter.'
        }));
        return callback();
      }

      var encryptedBody = cryptojs.AES.encrypt(marked(originalBody), password),
          hmac = cryptojs.HmacSHA256(encryptedBody.toString(), cryptojs.SHA256(password).toString()).toString(),
          encryptedFrontMatter = 'encrypted: ' + hmac + encryptedBody,
          result = [ delimiter, frontMatter, '\n', encryptedFrontMatter, '\n', delimiter ];

      file.contents = new Buffer(result.join(''));
      this.push(file);
      return callback();
    }
  });
}

gulp.task('firewall:encrypt', () => {
  return gulp.src('_protected/*.*')
    .pipe(encrypt('password'))
    .pipe(gulp.dest('_posts'));
});

gulp.task('firewall:watch', () => {
  gulp.watch('_protected/*.*', gulp.series('firewall:encrypt'));
});

gulp.task('firewall', gulp.series('firewall:encrypt', 'firewall:watch',() => {}));


/*
  END FIREWALL TASKS
*/

gulp.task('default', gulp.series('firewall', () => {
  // your tasks here
}));
