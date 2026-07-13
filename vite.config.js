import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' makes the build path-independent, so it works on GitHub Pages
// regardless of the repository name.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
