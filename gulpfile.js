var gulp = require('gulp'),
  connect = require('gulp-connect'),
  watch = require('gulp-watch'),
  coffee = require('gulp-coffee'),
  uglify  = require('gulp-uglify'),
  concat  = require('gulp-concat');
 
gulp.task('webserver', function() {
  connect.server({
    livereload: true,
    root: 'public'
  });
});
 
gulp.task('livereload', function() {
  watch('public/*')
    .pipe(connect.reload());
});
 
gulp.task('coffee', function() {
  gulp.src('source/scripts/*.coffee')
    .pipe(coffee())
    .pipe(gulp.dest('public/scripts'))
    .pipe(connect.reload());
});

// can add more here
gulp.task('watch', function() {
  gulp.watch('source/scripts/*.coffee', ['coffee'])
})

// TODO: all
gulp.task('minScripts', function() {
	gulp.src('public/scripts/*.js')
		.pipe(uglify())
		.pipe(concat('all.js'))
		.pipe(gulp.dest('public/scripts'));
});


gulp.task('default', ['coffee', 'webserver', 'livereload', 'watch']);