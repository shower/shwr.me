const del = require('del');
const fs = require('fs');
const gulp = require('gulp');
const merge = require('merge-stream');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const rsync = require('gulp-rsync');
const zip = require('gulp-zip');

gulp.task('clean', () => {
    return del('dest/**');
});

gulp.task('build', () => {
    const shower = gulp.src([
            '**',
            '!package.json'
        ], {
            cwd: 'node_modules/shower'
        })
        .pipe(replace(
            /(<link rel="stylesheet" href=")(node_modules\/@shower\/ribbon\/)(styles\/styles.css">)/g,
            '$1shower/themes/ribbon/$3', { skipBinary: true }
        ))
        .pipe(replace(
            /(<script src=")(node_modules\/shower-core\/)(shower.min.js"><\/script>)/g,
            '$1shower/$3', { skipBinary: true }
        ));

    const core = gulp.src([
            'shower.min.js'
        ], {
            cwd: 'node_modules/shower-core'
        })
        .pipe(rename( (path) => {
            path.dirname = 'shower/' + path.dirname;
        }));

    const material = gulp.src([
            '**',
            '!package.json'
        ], {
            cwd: 'node_modules/@shower/material'
        })
        .pipe(rename( (path) => {
            path.dirname = 'shower/themes/material/' + path.dirname;
        }))

    const ribbon = gulp.src([
            '**',
            '!package.json'
        ], {
            cwd: 'node_modules/@shower/ribbon'
        })
        .pipe(rename( (path) => {
            path.dirname = 'shower/themes/ribbon/' + path.dirname;
        }));

    const themes = merge(material, ribbon)
        .pipe(replace(
            /(<script src=")(node_modules\/shower-core\/)(shower.min.js"><\/script>)/g,
            '$1../../$3', { skipBinary: true }
        ));

    return merge(shower, core, themes)
        .pipe(gulp.dest('dest'))
        .pipe(zip('shower.zip'))
        .pipe(gulp.dest('dest'));
});

gulp.task('assets', () => {
    const files = gulp.src([
        'icons{,/**}',
        '.webmanifest',
        'favicon.ico'
    ]);

    const html = gulp.src('dest/**/*.html')
        .pipe(replace(
            /(<meta name="viewport" content="width=device-width, initial-scale=1">)/,
            `$1
    <link rel="manifest" href="/.webmanifest">
    <link rel="icon" href="/favicon.ico">
    <link rel="icon" type="image/png" sizes="228x228" href="/icons/228.png">
    <link rel="apple-touch-icon" type="image/png" href="/icons/228.png">`, { skipBinary: true }
        ));

    return merge(files, html)
        .pipe(gulp.dest('dest'));
});

gulp.task('sync', () => {
    return gulp.src('dest/**')
        .pipe(rsync({
            root: 'dest',
            hostname: 'shwr.me',
            destination: '/var/www/shwr.me/html',
            recursive: true,
            clean: true,
            incremental: true,
            silent: true
        }));
});

gulp.task('deploy', gulp.series(
    'clean',
    'build',
    'assets',
    'sync'
));
