import fs from 'node:fs';
import gulp from 'gulp';
import merge from 'merge-stream';
import rename from 'gulp-rename';
import replace from 'gulp-replace';
import zip from 'gulp-zip';

gulp.task('themes', () => {
    const shower = gulp.src([
            '**',
            '!package.json',
            '!node_modules',
        ], {
            cwd: 'node_modules/@shower/shower',
            encoding: false
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
            cwd: 'node_modules/@shower/core/dist',
            encoding: false
        })
        .pipe(rename( (path) => {
            path.dirname = 'shower/' + path.dirname;
        }));

    const material = gulp.src([
            '**',
            '!package.json',
            '!node_modules',
        ], {
            cwd: 'node_modules/@shower/material',
            encoding: false
        })
        .pipe(rename( (path) => {
            path.dirname = 'shower/themes/material/' + path.dirname;
        }))

    const ribbon = gulp.src([
            '**',
            '!package.json',
            '!node_modules',
        ], {
            cwd: 'node_modules/@shower/ribbon',
            encoding: false
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
    ], {
        encoding: false
    });

    const html = gulp.src('dist/**/*.html')
        .pipe(replace(
            /(<meta name="viewport" content=".*">)/,
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

gulp.task('build', gulp.series(
    'themes',
    'assets',
));
