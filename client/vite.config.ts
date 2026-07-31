import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          markdown: [
            "highlight.js",
            "react-markdown",
            "rehype-highlight",
            "remark-gfm",
          ],
          ui: [
            "antd",
            "framer-motion",
            "ldrs",
            "react-icons",
            "react-responsive",
            "react-toastify",
          ],
        },
      },
    },
  },
})
