var gulp = require('gulp'),
  watch = require('gulp-watch'),
  coffee = require('gulp-coffee'),
  sass = require('gulp-sass'),
  uglify  = require('gulp-uglify'),
  concat  = require('gulp-concat');
 
gulp.task('coffee-public', function() {
  gulp.src('app/public/scripts/*.coffee')
    .pipe(coffee())
    .pipe(gulp.dest('app/public/scripts'))
    // .pipe(connect.reload());
});

gulp.task('coffee-app', function() {
  gulp.src('app/*.coffee')
    .pipe(coffee())
    .pipe(gulp.dest('app'));
    // .pipe(connect.reload());
});

gulp.task('sass', function() {
  console.log('lala');
  gulp.src('app/public/styles/*.scss')
    .pipe(sass({errLogToConsole: true}))
    .pipe(gulp.dest('app/public/styles'));
    // .pipe(connect.reload());
});

// can add more here
gulp.task('watch', function() {
  gulp.watch('app/public/scripts/*.coffee', ['coffee-public']);
  gulp.watch('app/*.coffee', ['coffee-app']);
  gulp.watch('app/public/styles/*.scss', ['sass']);
});


var browserSync = require('browser-sync');
var nodemon = require('gulp-nodemon');
  
gulp.task('browser-sync', ['nodemon'], function() {
  browserSync.init(null, {
    proxy: "http://localhost:3000",
        files: ["app/public/**/*.*"],
        browser: "google chrome",
        port: 8080,
  });
});
 
gulp.task('nodemon', function (cb) {
  return nodemon({
    script: 'app/app.js'
  }).on('start', function () {
      cb();
  });
});

gulp.task('default', ['watch', 'browser-sync']);