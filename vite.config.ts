import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api/matches': {
          target: 'https://api.football-data.org/v4',
          changeOrigin: true,
          rewrite: (path) => {
            // A Vercel proxy (api/matches.ts) mintájára: ?competition=PL -> /competitions/PL/matches
            const url = new URL(path, 'http://localhost')
            const competition = url.searchParams.get('competition')
            if (competition) {
              const code = competition.replace(/[^A-Za-z0-9_-]/g, '').toUpperCase()
              const params = new URLSearchParams()
              for (const key of ['status', 'season']) {
                const value = url.searchParams.get(key)
                if (value) params.append(key, value)
              }
              const qs = params.toString()
              return `/competitions/${code}/matches${qs ? `?${qs}` : ''}`
            }
            return path.replace(/^\/api\/matches/, '/matches')
          },
          headers: env.FOOTBALL_DATA_API_KEY
            ? { 'X-Auth-Token': env.FOOTBALL_DATA_API_KEY }
            : {}
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
          headers: env.API_SPORTS_KEY
            ? { 'x-apisports-key': env.API_SPORTS_KEY }
            : {}
        }
      }
    }
  }
})
