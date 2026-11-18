import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Admin app runs on 5174 so it doesn't clash with the customer app (5173)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'HOST')

  return {
    plugins: [react()],
    define: {
      'import.meta.env.HOST': JSON.stringify(env.HOST || ''),
    },
    server: { port: 5174 },
  }
})
