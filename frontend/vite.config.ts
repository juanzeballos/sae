import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // "@/componente" apunta a "src/componente"
      // Es como un import absoluto: evita "../../.." en los imports
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
