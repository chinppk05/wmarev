// gulpfile.js
const gulp = require('gulp')
const { watch } = require('gulp')
const babel = require('gulp-babel');
const nodemon = require('gulp-nodemon');
const sourcemaps = require('gulp-sourcemaps');
const ts = require('gulp-typescript');

const { series } = require('gulp');

const tsProj = ts.createProject('tsconfig.json');

function build() {
    return gulp.src('src/**/*.ts')
        .pipe(sourcemaps.init())
        .pipe(tsProj())
        .pipe(babel())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'));
}

function start() {
    return nodemon({
        script: 'dist/index.js'
        , ext: 'js ts html'
        , env: { 'NODE_ENV': 'development' }
        //, done: done
    })
}

function watchTask() {
    watch(['src/**/*.ts'], function (cb) {
        build()
        // body omitted
        cb();
    });
}
exports.default = series(build, start);
exports.build = build;
exports.dev = series(build, watchTask);