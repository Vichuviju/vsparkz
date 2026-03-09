import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // No proxy - admin connects directly to backend at http://127.0.0.1:8000/api (CORS enabled on backend)
})
