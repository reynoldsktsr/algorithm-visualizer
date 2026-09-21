import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

// Library build: compiles src/ into a publishable, importable package in
// dist/ (ESM + CJS + type declarations). See vite.config.ts for the demo
// app build that is deployed to GitHub Pages.
export default defineConfig({
  publicDir: false,
  plugins: [
    react(),
    dts({
      tsconfigPath: 'tsconfig.app.json',
      entryRoot: 'src',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/App.tsx', 'src/main.tsx'],
      insertTypesEntry: true,
    }),
  ],
  build: {
    outDir: 'dist',
    cssCodeSplit: false,
    lib: {
      entry: new URL('src/index.ts', import.meta.url).pathname,
      name: 'AlgorithmVisualizer',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'algorithm-visualizer.js' : 'algorithm-visualizer.cjs'),
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        exports: 'named',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
})
