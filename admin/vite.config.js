import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Admin app runs on 5174 so it doesn't clash with the customer app (5173)
export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
})
