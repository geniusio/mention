'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var fs = require('fs');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var wrap = require('gulp-wrap');

var port = gutil.env.port || 3000;
var covport = gutil.env.covport || 3001;
var lrport = gutil.env.lrport || 35729;
var openBrowser = gutil.env.browser;

/*
 * Default task is to start the site
 */
gulp.task('default', ['site']);

gulp.task('site', ['dist'], function () {
    var express = require('express');
    var app = express();

    app.use(require('connect-livereload')({
        port: lrport
    }));

    app.use(express.static('./'));

    app.listen(port, function () {
        var lrServer = require('gulp-livereload')();

        gulp.watch(['src/**/*.*', 'ment.io/*.*'], ['dist']).on('change', function (file) {
            console.log('Reload', file.path);
            lrServer.changed(file.path);
        });

        // open the browser
        require('open')('http://localhost:' + port + '/ment.io', openBrowser);

        console.log('Example app started on port [%s]', port);
    });
});

gulp.task('dist', function () {
    return gulp.src([
//        'bower_components/textarea-caret-position/index.js',
        'src/mentio.directive.js',
        'src/mentio.service.js'
    ])
    .pipe(concat('mentio.js'))
//    // hack to make componentjs libs to work
//    .pipe(wrap('(function () {\n\n\'use strict\';\n\nvar Package = \'\';' +
//        '\n\nvar getCaretCoordinates ;\n\n<%= contents %>\n\n})();'))
    .pipe(gulp.dest('dist'))
    .pipe(uglify())
    .pipe(concat('mentio.min.js'))
    .pipe(gulp.dest('dist'));
});


function testTask (params) {
    var karma = require('gulp-karma');

    var karmaConfig = {
        configFile: './karma.conf.js',
        action: params.isWatch ? 'watch' : 'run'
    };

    if (params.coverageReporter) {
        karmaConfig.coverageReporter = params.coverageReporter;
    }

    if (params.reporters) {
        karmaConfig.reporters = params.reporters;
    }

    return gulp.src('DO_NOT_MATCH') //use the files in the karma.conf.js
        .pipe(karma(karmaConfig));
}

/**
 * Run the karma spec tests
 */
gulp.task('test', ['dist'], function () {
    testTask({
        isWatch: gutil.env.hasOwnProperty('watch')
    });
});

gulp.task('coverage', function () {
    var express = require('express');
    var app = express();
    var coverageFile;
    var karmaHtmlFile;

    function getTestFile (path) {
        if (fs.existsSync(path)) {
            var files = fs.readdirSync(path);

            if (files) {
                for (var i = 0; i < files.length; i++) {
                    if (fs.lstatSync(path + '/' + files[i]).isDirectory()) {
                        return files[i];
                    } else {
                        return files[i];
                    }
                }
            }
        }
    }

    testTask({
        isWatch: gutil.env.hasOwnProperty('watch'),
        reporters: ['progress', 'coverage', 'threshold']
    });

    setTimeout(function () {
        coverageFile = getTestFile('coverage');
        karmaHtmlFile = getTestFile('karma_html');

        app.use(express.static('./'));

        app.listen(covport, function openPage () {
            if (coverageFile) {
                require('open')('http://localhost:' + covport + '/coverage/' + coverageFile);
            }
        });
    }, 3000);
});