import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

//IMPORTANT: use vitest/config here
export default defineConfig({
  plugins: [react()],


  test: {
    environment: "jsdom",
    include: ["src/tests/**/*.test.js"],
  },
})