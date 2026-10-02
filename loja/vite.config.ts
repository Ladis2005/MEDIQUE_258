import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // O 3D (three.js) e o painel são carregados só quando são precisos (imports dinâmicos).
  build: { chunkSizeWarningLimit: 1100 },
})
