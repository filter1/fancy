var gulp = require('gulp'),
  connect = require('gulp-connect'),
  watch = require('gulp-watch'),
  coffee = require('gulp-coffee'),
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

// can add more here
gulp.task('watch', function() {
  gulp.watch('app/scripts/*.coffee', ['coffee'])
})

// TODO: all
gulp.task('minScripts', function() {
	gulp.src('app/scripts/*.js')
		.pipe(uglify())
		.pipe(concat('all.min.js'))
		.pipe(gulp.dest('app/scripts'));
});


gulp.task('default', ['coffee', 'webserver', 'livereload', 'watch']);