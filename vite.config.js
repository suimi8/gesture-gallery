
import { defineConfig } from 'vite'

export default defineConfig({
  base: './', // Important for Electron relative paths
  build: {
    outDir: 'dist',
    assetsDir: '.', // Put assets in root of dist for simpler path resolution
  }
})
