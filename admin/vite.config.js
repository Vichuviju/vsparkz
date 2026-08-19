import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isGitHubPages = mode === 'pages' || process.env.GITHUB_PAGES === 'true'
  const repoBase = env.VITE_BASE_PATH || '/vsparkz/admin/'

  return {
    base: isGitHubPages ? repoBase : '/',
    plugins: [react()],
  }
})
