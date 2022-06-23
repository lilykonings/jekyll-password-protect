const gulp = require('gulp');
const cryptojs = require('crypto-js');
const marked = require('marked');
const through = require('through2');

/*
  START FIREWALL TASKS
*/
function checkEncryptedLayout(frontMatter, filepath) {
  let lines = frontMatter.split('\n'), hasEncryptedLayout = false;

  lines.forEach(function (line) {
    const layoutTag = 'layout:',
        isLayoutIndex = line.indexOf(layoutTag),
        isLayout = isLayoutIndex >= 0,
        isEncryptedLayout = line.indexOf('encrypted') >= (isLayoutIndex + layoutTag.length);

    if (isLayout)hasEncryptedLayout = isEncryptedLayout;
  });

  if (!hasEncryptedLayout) {
    console.log('[WARNING] ' + filepath + ': protected file not using encrypted layout.');
  }
}

function encrypt(password) {
  return through.obj(function (file, encoding, callback) {
    if (file.isNull() || file.isDirectory()) {
      this.push(file);
      return callback();
    }

    // No support for streams
    if (file.isStream()) {
      this.emit('error', new PluginError({
        plugin: 'Encrypt', message: 'Streams are not supported.'
      }));
      return callback();
    }

    if (file.isBuffer()) {
      let delimiter = '---\n', chunks = String(file.contents).split(delimiter), originalBody = chunks[0],
          frontMatter = '';

      if (chunks.length === 3) {
        checkEncryptedLayout(chunks[1], file.path);
        frontMatter = chunks[1];
        originalBody = chunks[2];
      }

      const encryptedBody = cryptojs.AES.encrypt(marked.parse(originalBody), password),
          hmac = cryptojs.HmacSHA256(encryptedBody.toString(), cryptojs.SHA256(password).toString()).toString(),
          encryptedFrontMatter = 'encrypted: ' + hmac + encryptedBody,
          result = [delimiter, frontMatter, '\n', encryptedFrontMatter, '\n', delimiter];

      file.contents = new Buffer.from(result.join(''));
      this.push(file);
      return callback();
    }
  });
}

gulp.task('default', gulp.series(done => {
  return gulp.src('_protected/*.*')
      .pipe(encrypt('password'))
      .pipe(gulp.dest('_posts'));
}));
