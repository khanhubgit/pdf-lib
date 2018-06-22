const gulp = require('gulp');
const ts = require('gulp-typescript');
const babel = require('gulp-babel');
const filter = require('gulp-filter');
const del = require('del');
const { execSync } = require('child_process');

/* =============================== Setup ==================================== */

const tsProject = ts.createProject('tsconfig.json', { module: 'es2015' });

const babelrc = {
  plugins: [
    [
      'module-resolver',
      {
        root: ['./compiled'],
        alias: {
          core: './src/core',
          helpers: './src/helpers',
          utils: './src/utils',
        },
      },
    ],
  ],
};

const jsFilter = filter(['**/*.js'], { restore: true });

const rollup = (dir, format, minify) => () =>
  execSync(`
    export UGLIFY=${minify};        \\
    yarn rollup                     \\
      -c rollup.config.js           \\
      -o compiled/${dir}/pdf-lib${minify ? '.min' : ''}.js \\
      --format ${format}
  `);

/* =============================== Tasks ==================================== */

gulp.task('prepare-release', () =>
  execSync(`
    rm -rf node_modules && \\
    yarn                && \\
    yarn lint           && \\
    yarn test:ci
  `),
);

gulp.task(
  'build-release',
  ['rollup-commonjs', 'rollup-es', 'rollup-umd', 'rollup-umd-min'],
  () =>
    execSync(`
    cp -r  package.json README.md LICENSE.md compiled/ && \\
    rm -rf compiled/__integration_tests__ compiled/src
  `),
);

gulp.task('build-dev', [
  'rollup-commonjs',
  'rollup-es',
  'rollup-umd',
  'rollup-umd-min',
]);

gulp.task('clean', () => del('compiled/**'));

gulp.task('compile-to-js', ['clean'], () =>
  tsProject
    .src()
    .pipe(tsProject())
    .pipe(jsFilter)
    .pipe(babel(babelrc))
    .pipe(jsFilter.restore)
    .pipe(gulp.dest('compiled')),
);

gulp.task('rollup-commonjs', ['compile-to-js'], rollup('lib', 'cjs'));
gulp.task('rollup-es', ['compile-to-js'], rollup('es', 'es'));
gulp.task('rollup-umd', ['compile-to-js'], rollup('dist', 'umd'));
gulp.task('rollup-umd-min', ['compile-to-js'], rollup('dist', 'umd', true));
