import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const skillsToken = env.VITE_SKILLS_SH_TOKEN ?? ''

  return {
    plugins: [react(), tailwindcss()],
    // مسیر نسبی — الزامی برای لود شدن داراییها در پروتکل file:// الکترون
    base: './',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      // پروکسی API اسکیلها — دور زدن CORS در توسعه؛ توکن سمت سرور تزریق میشود
      proxy: {
        '/skills-api': {
          target: 'https://skills.sh',
          changeOrigin: true,
          rewrite: p => p.replace(/^\/skills-api/, '/api/v1'),
          headers: skillsToken ? { Authorization: `Bearer ${skillsToken}` } : {},
          secure: true
        }
      }
    }
  }
})
