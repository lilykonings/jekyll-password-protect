# jekyll-firewall
Password protect Jekyll posts.

![Demo](https://github.com/lllychen/jekyll-firewall/blob/master/demo.gif)

## Disclaimers
Before using, keep the following in mind:

- This encryption type is weak against brute force attacks. [Here](https://github.com/lllychen/jekyll-firewall/pull/3/commits/038ce8e143d1749375137589fca8e1401a82f4bf) is an example of a safe guard by [mrlubos](https://github.com/mrlubos).
- Liquid templating isn't currently supported in protected posts
- Use only Markdown syntax supported by [marked](https://marked.js.org)
- The password needs to be entered for each protected post. But you can easily store a successful password in cache and bypass subsequent logins
- I discourage storing your site in a public repository unless you are okay with gitignoring sensitive information (and have no remote backup)

## Installation
To begin a new site, build on top of this repository by forking or cloning.

To integrate with an existing Jekyll site, below are the necessary files:
- `_layouts/encrypted` &mdash; The layout for a locked page
- `gulpfile` &mdash; The Gulp file to encrypt posts

## Usage
### Site Structure &amp; Password
The `encrypt` gulp task (below) encrypts each file in `SRC-FOLDER` with `PASSWORD` and outputs it into `DEST-FOLDER`. Change these settings in `gulpfile.js` according to your site structure.

``` js
gulp.task('encrypt', () => {
  return gulp.src('SRC-FOLDER')
    .pipe(encrypt('PASSWORD'))
    .pipe(gulp.dest('DEST-FOLDER'));
});
```

Heads up that if you write public posts to `DEST-FOLDER`, it may be difficult to distinguish the public and protected posts. This can be easily amended but is outside the scope of the skeleton site in this repo. However, you can adjust the gulp `encrypt` task to change the outputted filename of protected files in the `DEST-FOLDER` and set the url in the front matter.

### Protect Posts
To encrypt a post, simply save it in your desinated `SRC-FOLDER` and run `gulp`.

## Credit
### Libraries
- [cryptojs](https://github.com/brix/crypto-js)
- [markedjs](https://github.com/markedjs/marked)

### Contributors
- [mrlubos](https://github.com/mrlubos)
- [Firefox2100](https://github.com/Firefox2100)
