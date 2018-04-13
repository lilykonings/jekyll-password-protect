# jekyll-firewall
Password protect Jekyll posts.

## Disclaimer
In addition to the disclaimers put forth by [crypto-js](https://github.com/brix/crypto-js) and [staticrypt](https://github.com/robinmoisson/staticrypt), 

- Liquid templating isn't currently supported in protected posts
- Use only Markdown syntax supported by [marked](https://marked.js.org)

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
