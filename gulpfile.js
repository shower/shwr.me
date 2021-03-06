const del = require('del');
const fs = require('fs');
const gulp = require('gulp');
const merge = require('merge-stream');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const rsync = require('gulp-rsync');
const zip = require('gulp-zip');

gulp.task('clean', () => {
    return del('dist/**');
});

gulp.task('build', () => {
    const shower = gulp.src([
            '**',
            '!package.json',
            '!node_modules',
        ], {
            cwd: 'node_modules/@shower/shower'
        })
        .pipe(replace(
            /(<link rel="stylesheet" href=")(node_modules\/@shower\/ribbon\/)(styles\/styles.css">)/g,
            '$1shower/themes/ribbon/$3', { skipBinary: true }
        ))
        .pipe(replace(
            /(<script src=")(node_modules\/@shower\/core\/dist\/)(shower.js"><\/script>)/g,
            '$1shower/$3', { skipBinary: true }
        ));

    const core = gulp.src([
            'shower.js'
        ], {
            cwd: 'node_modules/@shower/core/dist'
        })
        .pipe(rename( (path) => {
            path.dirname = 'shower/' + path.dirname;
        }));

    const material = gulp.src([
            '**',
            '!package.json',
            '!node_modules',
        ], {
            cwd: 'node_modules/@shower/material'
        })
        .pipe(rename( (path) => {
            path.dirname = 'shower/themes/material/' + path.dirname;
        }))

    const ribbon = gulp.src([
            '**',
            '!package.json',
            '!node_modules',
        ], {
            cwd: 'node_modules/@shower/ribbon'
        })
        .pipe(rename( (path) => {
            path.dirname = 'shower/themes/ribbon/' + path.dirname;
        }));

    const themes = merge(material, ribbon)
        .pipe(replace(
            /(<script src=")(node_modules\/@shower\/core\/dist\/)(shower.js"><\/script>)/g,
            '$1../../$3', { skipBinary: true }
        ));

    return merge(shower, core, themes)
        .pipe(gulp.dest('dist'))
        .pipe(zip('shower.zip'))
        .pipe(gulp.dest('dist'));
});

gulp.task('assets', () => {
    const files = gulp.src([
        'icons{,/**}',
        'manifest.json',
    ]);

    const html = gulp.src('dist/**/*.html')
        .pipe(replace(
            /(<meta name="viewport" content="width=device-width, initial-scale=1">)/,
            `$1
    <link rel="manifest" href="/manifest.json">
    <link rel="icon" type="image/png" sizes="16x16" href="/icons/16.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/icons/32.png">
    <link rel="icon" type="image/png" sizes="160x160" href="/icons/160.png">
    <link rel="icon" type="image/svg+xml" sizes="any" href="/icons/any.svg">
    <link rel="apple-touch-icon" href="/icons/228.png">`, { skipBinary: true }
        ));

    return merge(files, html)
        .pipe(gulp.dest('dist'));
});

gulp.task('sync', () => {
    return gulp.src('dist/**')
        .pipe(rsync({
            root: 'dist',
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
