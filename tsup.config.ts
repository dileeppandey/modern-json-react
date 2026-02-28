import { defineConfig } from 'tsup';
import { copyFileSync } from 'fs';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: false,
  clean: true,
  external: ['react', 'react-dom'],
  treeshake: true,
  minify: true,
  onSuccess: async () => {
    // Copy the CSS file to dist so consumers can import it
    copyFileSync('src/styles.css', 'dist/styles.css');
  },
});
