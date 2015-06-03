var gulp = require('gulp'),
  // connect = require('gulp-connect'),
  watch = require('gulp-watch'),
  coffee = require('gulp-coffee'),
  sass = require('gulp-sass'),
  uglify  = require('gulp-uglify'),
  concat  = require('gulp-concat');
 
// gulp.task('webserver', function() {
//   connect.server({
//     livereload: true,
//     root: 'app'
//   });
// });
 
// gulp.task('livereload', function() {
//   watch('app/*')
//     .pipe(connect.reload());
// });
 
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

gulp.task('coffee-public', function() {
  gulp.src('app/public/scripts/*.coffee')
    .pipe(coffee())
    .pipe(gulp.dest('app/public/scripts'));
    // .pipe(connect.reload());
});


gulp.task('sass', function() {
  gulp.src('app/public/styles/*.scss')
    .pipe(sass({errLogToConsole: true}))
    .pipe(gulp.dest('app/public/styles'));
    // .pipe(connect.reload());
});

// can add more here
gulp.task('watch', function() {
  gulp.watch('app/public/scripts/*.coffee', ['coffee-public'])
  gulp.watch('app/*.coffee', ['coffee-app'])
  gulp.watch('app/styles/*.scss', ['sass'])
});

gulp.task('default', ['watch']);