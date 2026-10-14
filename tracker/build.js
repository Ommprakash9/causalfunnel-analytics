const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/tracker.js'],
  bundle: true,
  minify: true,
  outfile: 'dist/tracker.js',
  format: 'iife',
  target: ['es2015'],
  platform: 'browser',
}).then(() => {
  console.log('✓ Tracker SDK built successfully');
}).catch((err) => {
  console.error('✗ Build failed:', err);
  process.exit(1);
});
