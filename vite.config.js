import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    // 允许ngrok等外部Host访问
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'c07a-125-86-165-145.ngrok-free.app',
      '.ngrok-free.app' // 允许所有ngrok子域名
    ],
    // 确保所有网络接口都可以访问
    host: '0.0.0.0'
  }
})
