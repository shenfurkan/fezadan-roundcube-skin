// Builds the tracked MUI bundle. Roundcube servers run no Node, so the output
// in skin/material.js is committed.
import { build } from 'esbuild';

await build({
    entryPoints: ['ui-src/main.tsx'],
    outfile: 'skin/material.js',
    bundle: true,
    minify: true,
    format: 'iife',
    target: ['es2020'],
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"production"' },
    logLevel: 'info',
});
