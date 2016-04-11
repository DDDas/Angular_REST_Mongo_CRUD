var gulp = require('gulp');
var gutil = require('gulp-util');
var gulpif = require('gulp-if');
var concat = require('gulp-concat');
var buffer = require('vinyl-buffer');
var source = require('vinyl-source-stream');
var babelify = require('babelify');
var browserify = require('browserify');
var watchify = require('watchify');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var gulp = require('gulp');
var server = require('./server');
var config = require('./config');
var browserSync  = require('browser-sync');
var sass         = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');

gulp.task('browserify-vendor', function() {
  return browserify()
    .require(config.vendorBundle.dependencies)
    .bundle()
    .pipe(source(config.vendorBundle.out))
    .pipe(buffer())
    .pipe(gulpif(config.production.env, uglify({ mangle: false })))
    .pipe(gulp.dest(config.vendorBundle.dest));
});

gulp.task('browserify', ['browserify-vendor'], function() {
  return browserify({ entries: config.bundle.src, debug: true })
    .external(config.bundle.dependencies)
    .transform(babelify, { presets: config.babel.dependencies })
    .bundle()
    .pipe(source(config.bundle.out))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(gulpif(config.production.env, uglify({ mangle: false })))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(config.bundle.dest));
});

gulp.task('browserify-watch', ['browserify-vendor'], function() {
  var bundler = watchify(browserify({ entries: config.bundle.src, debug: true }, watchify.args));
  bundler.external(config.bundle.dependencies);
  bundler.transform(babelify, { presets: config.babel.dependencies });
  bundler.on('update', rebundle);
  return rebundle();

  function rebundle() {
    var start = Date.now();
    return bundler.bundle()
      .on('error', function(err) {
        gutil.log(gutil.colors.red(err.toString()));
      })
      .on('end', function() {
        gutil.log(gutil.colors.green('Finished rebundling in', (Date.now() - start) + 'ms.'));
      })
      .pipe(source(config.bundle.out))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(config.bundle.dest));
  }
});

gulp.task('sass', function () {
  return gulp.src(config.sass.src)
    .pipe(sass(config.sass.settings))
    .pipe(autoprefixer({ browsers: ['last 2 version'] }))
    .pipe(gulp.dest(config.sass.dest))
    .pipe(browserSync.reload({stream:true}));
});

gulp.task('sass-watch', function() {
  gulp.watch(config.sass.src, ['sass']);
});

gulp.task('markup', function() {
  return gulp.src(config.markup.src)
    .pipe(gulp.dest(config.markup.dest))
    .pipe(browserSync.reload({stream:true}));
});

gulp.task('start-server', function() {
  server.start();
});

gulp.task('default', ['browserify-watch', 'sass', 'markup', 'sass-watch']);
gulp.task('build', ['browserify', 'sass', 'markup']);