/**
 *
 * Frontend Starter Kit
 * Copyright 2015 Eli Van Zoeren
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 */

'use strict';

/************************************************
 * CONFIGURATION
 ************************************************/

var baseUrl = 'http://frontend.dev';

// File paths
var srcPath    = 'src/';
var basePath   = 'public_html/';
var distPath   = basePath+'assets/';
var vendorPath = srcPath+'vendor/';

var src = {
    fonts:   srcPath+'fonts/',
    images:  srcPath+'images/',
    scripts: srcPath+'js/',
    sprites: srcPath+'sprites/',
    styles:  srcPath+'sass/'
};

var dist = {
    fonts:   distPath+'fonts/',
    images:  distPath+'images/',
    scripts: distPath+'js/',
    sprites: distPath+'images/',
    styles:  distPath+'css/'
};

// Uncomment to test static files without a local server
// var browserSyncConfig = {
//     server: {
//         baseDir: './'+basePath,
//         open: 'external',
//         xip: true
//     }
// };
// ----- OR -----
// Uncomment when running a local server, and enter the test domain
var browserSyncConfig = {
    proxy: baseUrl,
    open: 'external',
    xip: true
};

// Options for AutoPrefixer
var autoprefixerOpts = [
    'last 2 versions',
    '> 1%',
    'ie >= 8',
    'android >= 4'
];

// Additional CSS files to include (outside of the src/css folder)
var cssComponents = [
];

// Additional Javascript files to include (outside of the src/js folder)
var jsComponents = [
    vendorPath+'respimage/respimage.js'
];

// Additional Javascript files to load in the head
// (outside of the src/js/compatibility folder)
var jsHeaderComponents = [
];

// Javascript that is only needed for IE8 and below
var jsIE8Components = [
    vendorPath+'htmlshiv/dist/html5shiv-printshiv.js',
    vendorPath+'respondJs/dest/respond.src.js'
];

// Enable or disable particular jQuery modules
var jqueryFlags = ['-deprecated', '-core/ready', '-css', '-effects', '-event-alias'];


//***********************************************
// SET UP GULP
//***********************************************

// Include Gulp & Tools We'll Use
var argv = require('yargs').argv;
var gulp = require('gulp');
var lazypipe = require('lazypipe');
var pngquant = require('imagemin-pngquant');
var browserSync = require('browser-sync').create();
var $ = require('gulp-load-plugins')({
        pattern: 'gulp{-,.}*',
        replaceString: /gulp(\-|\.)/
    });

// Set environment
var devMode = !argv.production;

// Error handler for Plumber
var handleError = function(error) {
    $.notify.onError({
        title: "Gulp Error",
        message: "<%= error.message %>",
        sound: "Beep"
    })(error);

    this.emit('end');
};

// Image optimization settings
var imageminOpts = {
    progressive: true,
    interlaced: true,
    multipass: true,
    use: [
        pngquant({ quality: '65-80' })
    ]
};


//***********************************************
// STYLES
//***********************************************

var stylesDevelopment = lazypipe()
    .pipe($.plumber, { errorHandler: handleError })
    .pipe($.sourcemaps.init)
    .pipe($.sass)
    .pipe($.autoprefixer, { browsers: autoprefixerOpts })
    .pipe($.sourcemaps.write, './')
    .pipe(gulp.dest, dist.styles)
    .pipe($.filter, ['*.css'])
    .pipe(browserSync.stream)
    .pipe($.csso)
    .pipe($.size, {
        gzip: true,
        showFiles: true
    });

var stylesProduction = lazypipe()
    .pipe($.plumber, { errorHandler: handleError })
    .pipe($.sass)
    .pipe($.autoprefixer, { browsers: autoprefixerOpts })
    .pipe($.csso)
    .pipe(gulp.dest, dist.styles);

// Compile Sass
gulp.task('styles', function() {
    var stylesTask = devMode ? stylesDevelopment : stylesProduction;

    return gulp.src(cssComponents.concat([
            src.styles+'*.scss'
        ]))
        .pipe(stylesTask());
});


//***********************************************
// JAVASCRIPT
//***********************************************

var scriptsDevelopment = function(filename) {
    return lazypipe()
        .pipe($.plumber, { errorHandler: handleError })
        .pipe($.sourcemaps.init)
        .pipe($.concat, filename)
        .pipe($.babel)
        .pipe($.sourcemaps.write, './')
        .pipe(gulp.dest, dist.scripts)
        .pipe($.filter, ['*.js'])
        .pipe(browserSync.stream)
        .pipe($.uglify)
        .pipe($.size, {
            gzip: true,
            showFiles: true
        });
};

var scriptsProduction = function(filename) {
    return lazypipe()
        .pipe($.concat, filename)
        .pipe($.babel)
        .pipe($.uglify)
        .pipe(gulp.dest, dist.scripts);
};

// Lint our Javascript
gulp.task('scripts:lint', function() {
    return gulp.src([
            src.scripts+'*/**/*.js',
            '!'+src.scripts+'header{,/**}'
        ])
        .pipe($.cached('esLint'))
        .pipe($.eslint())
        .pipe($.eslint.format());
});

// Compile main scripts to be included at the bottom of the page
gulp.task('scripts:main', ['scripts:lint'], function() {
    var fileName = 'scripts.js';
    var scriptsTask = devMode ? scriptsDevelopment(fileName) : scriptsProduction(fileName);

    return gulp.src(jsComponents.concat([
            src.scripts+'*/**/*.js',
            src.scripts+'*.js',
            '!'+src.scripts+'header{,/**}'
        ]))
        .pipe($.plumber({ errorHandler: handleError }))
        .pipe(scriptsTask());
});

// Compile IE8 compatibility scripts that should load in the head
gulp.task('scripts:ie8', function() {
    var fileName = 'ie8.js';
    var scriptsTask = devMode ? scriptsDevelopment(fileName) : scriptsProduction(fileName);

    return gulp.src(jsIE8Components)
        .pipe($.plumber({ errorHandler: handleError }))
        .pipe(scriptsTask());
});

// Compile general-purpose compatibility scripts that should load in the head
gulp.task('scripts:header', function() {
    var fileName = 'header.js';
    var scriptsTask = devMode ? scriptsDevelopment(fileName) : scriptsProduction(fileName);

    return gulp.src([
            src.scripts+'header/**/*.js',
        ].concat(jsHeaderComponents))
        .pipe($.plumber({ errorHandler: handleError }))
        .pipe(scriptsTask());
});

// Get the most recent 1.x version of jQuery
gulp.task('scripts:jquery', function() {
    var fileName = 'jquery.1.js';
    var verOneTask = devMode ? scriptsDevelopment(fileName) : scriptsProduction(fileName);
    fileName = 'jquery.2.js';
    var verTwoTask = devMode ? scriptsDevelopment(fileName) : scriptsProduction(fileName);

    $.jquery.src({
            release: 1,
            flags: jqueryFlags
        })
        .pipe(verOneTask());

    $.jquery.src({
            release: 2,
            flags: jqueryFlags
        })
        .pipe(verTwoTask());
});


//***********************************************
// WEBFONTS
//***********************************************

// Copy Web Fonts To Dist
gulp.task('fonts', function () {
    return gulp.src(src.fonts)
        .pipe($.flatten())
        .pipe(gulp.dest(dist.fonts))
        .pipe(browserSync.stream())
        .pipe($.size({
            gzip: true,
            showFiles: true
        }));
});


//***********************************************
// IMAGES
//***********************************************

// Optimize Images
gulp.task('images', function () {
    return gulp.src(src.images+'**/*.{jpg,jpeg,png,gif,svg}')
        .pipe($.plumber({ errorHandler: handleError }))
        .pipe($.cached('images'))
        .pipe($.imagemin(imageminOpts))
        .pipe(gulp.dest(dist.images))
        .pipe(browserSync.stream())
        .pipe($.size({
            gzip: true,
            showFiles: true
        }))
        .pipe($.filter(['*.svg']))
        .pipe($.svg2png())
        .pipe($.imagemin(imageminOpts))
        .pipe(gulp.dest(dist.images));
});

// Buld SVG Sprites
gulp.task('sprites', function() {
    return gulp.src(src.sprites+'*.svg')
        .pipe($.plumber({ errorHandler: handleError }))
        .pipe($.svgSprite({
            mode: {
                css: {
                    dest: "./",
                    layout: "vertical",
                    sprite: "sprites.svg",
                    bust: false,
                    render: {
                        scss: {
                            dest: "../../src/sass/generated/_sprites.scss",
                            template: srcPath+"build/sprites-template.scss"
                        }
                    }
                }
            }
        }))
        .pipe($.imagemin(imageminOpts))
        .pipe(gulp.dest(dist.sprites))
        .pipe($.filter(['*.svg']))
        .pipe($.svg2png())
        .pipe($.imagemin(imageminOpts))
        .pipe(gulp.dest(dist.sprites))
});


//***********************************************
// WATCH FOR CHANGES
//***********************************************

// Watch Files For Changes & Reload
gulp.task('watch', function () {
    browserSync.init(browserSyncConfig);

    gulp.watch([basePath+'/**/*.html'], browserSync.reload);
    gulp.watch([src.styles+'**/*.scss'], ['styles']);
    gulp.watch([src.scripts+'**/*.js'], ['scripts:main']);
    gulp.watch([src.scripts+'header/**/*.js'], ['scripts:header']);
    gulp.watch([src.fonts+'*'], ['fonts']);
    gulp.watch([src.images+'**/*.{jpg,jpeg,png,gif,svg}'], ['images']);
    gulp.watch([src.sprites+'**/*.svg'], ['sprites']);
});

// Clean distribution directories
gulp.task('clean', require('del').bind(null, [distPath], {dot: true}));

// Default Task
gulp.task('default', ['clean'], function() {
    gulp.start(
        'styles',
        'scripts:main',
        'scripts:ie8',
        'scripts:header',
        'scripts:jquery',
        'fonts',
        'images',
        'sprites'
    );
});
