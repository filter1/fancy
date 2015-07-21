var gulp = require('gulp'),
  coffee = require('gulp-coffee'),
  sass = require('gulp-sass'),
  uglify  = require('gulp-uglify'),
  nodemon = require('gulp-nodemon'),
  concat  = require('gulp-concat');
 
gulp.task('coffee-frontend', function() {
  gulp.src('app/public/scripts/*.coffee')
    .pipe(concat('fancy.coffee'))
    .pipe(coffee())
    .pipe(gulp.dest('app/public/scripts'))
});

gulp.task('coffee-backend', function() {
  gulp.src('app/*.coffee')
    .pipe(coffee())
    .pipe(gulp.dest('app'));
});

gulp.task('sass', function() {
  console.log('lala');
  gulp.src('app/public/styles/*.scss')
    .pipe(sass({errLogToConsole: true}))
    .pipe(gulp.dest('app/public/styles'));
});

// can add more here
gulp.task('watch', function() {
  gulp.watch('app/public/scripts/*.coffee', ['coffee-frontend']);
  gulp.watch('app/*.coffee', ['coffee-backend']);
  gulp.watch('app/public/styles/*.scss', ['sass']);
});

gulp.task('start', function () {
  nodemon({
    script: 'app/app.js'
  , env: { 'NODE_ENV': 'development' }
  })
})

gulp.task('default', ['coffee-frontend', 'coffee-backend', 'watch', 'start']);