import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'HOST')

  return {
    plugins: [react()],
    define: {
      'import.meta.env.HOST': JSON.stringify(env.HOST || ''),
    },
  }
})
