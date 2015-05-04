var gulp = require('gulp'),
  connect = require('gulp-connect'),
  watch = require('gulp-watch'),
  coffee = require('gulp-coffee'),
  sass = require('gulp-sass'),
  uglify  = require('gulp-uglify'),
  concat  = require('gulp-concat');
 
gulp.task('webserver', function() {
  connect.server({
    livereload: true,
    root: 'app'
  });
});
 
gulp.task('livereload', function() {
  watch('app/*')
    .pipe(connect.reload());
});
 
gulp.task('coffee', function() {
  gulp.src('app/scripts/*.coffee')
    .pipe(coffee())
    .pipe(gulp.dest('app/scripts'))
    .pipe(connect.reload());
});

gulp.task('sass', function() {
  gulp.src('app/styles/*.scss')
    .pipe(sass({errLogToConsole: true}))
    .pipe(gulp.dest('app/styles'))
    .pipe(connect.reload());
});

// can add more here
gulp.task('watch', function() {
  gulp.watch('app/scripts/*.coffee', ['coffee'])
  gulp.watch('app/styles/*.scss', ['sass'])

});

gulp.task('default', ['coffee', 'sass', 'webserver', 'livereload', 'watch']);