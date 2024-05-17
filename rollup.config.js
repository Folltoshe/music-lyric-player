const resolve = require('@rollup/plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')
const typescript = require('@rollup/plugin-typescript')

exports.default = {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/music-lyric-player.js',
      format: 'cjs',
    },
    {
      file: 'dist/music-lyric-player.esm.js',
      format: 'esm',
    },
  ],
  plugins: [
    typescript({
      tsconfig: 'tsconfig.json',
      outDir: './',
    }),
    resolve(),
    commonjs(),
  ],
}
