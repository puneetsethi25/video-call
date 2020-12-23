const { src, dest } = require('gulp');
const babel = require('gulp-babel');
const minify = require('gulp-minify');

exports.default = function() {
  return src('src/*.js')
    .pipe(babel())
    .pipe(src('js/*.js'))
    .pipe(src('lib/*.js'))
    .pipe(src('css/*.css'))
    .pipe(minify())
    .pipe(dest('build/'));
}