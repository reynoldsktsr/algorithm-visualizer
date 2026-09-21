import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Demo app build (deployed to GitHub Pages). See vite.lib.config.ts for the
// library build that produces the publishable component package.
export default defineConfig({
  base: '/algorithm-visualizer/',
  plugins: [react()],
  build: {
    outDir: 'dist-demo',
  },
})
