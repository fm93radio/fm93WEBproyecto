import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // O el plugin que uses (vue, svelte, etc.)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react( )],
  // ESTA LÍNEA ES LA MÁS IMPORTANTE:
  base: './', 
  build: {
    // Esta línea también es importante para confirmar:
    outDir: 'dist' 
  }
})
