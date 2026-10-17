import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api/matches': {
        target: 'https://api.football-data.org/v4',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/matches/, '/matches'),
        headers: {
          'X-Auth-Token': '0a2ff5ef40ed4113a0ca28d6b9b122d8'
        }
      },
      '/api/apisports': {
        target: 'https://v3.football.api-sports.io',
        changeOrigin: true,
        rewrite: (path) => {
          if (path.includes('fixture=')) {
            return path.replace(/^\/api\/apisports/, '/odds');
          }
          return path.replace(/^\/api\/apisports/, '/fixtures');
        },
        headers: {
          'x-apisports-key': 'b088263aae59a54a7f9a597f1ce83644'
        }
      }
    }
  }
})

