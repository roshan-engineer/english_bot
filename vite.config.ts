import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Allow Vite to process WASM files as assets
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    // Exclude WASM-based packages from pre-bundling so dynamic imports work
    exclude: ['@runanywhere/web-llamacpp', '@runanywhere/web-onnx'],
  },
  server: {
    headers: {
      // Required for SharedArrayBuffer and multi-threaded WASM
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
  },
})
