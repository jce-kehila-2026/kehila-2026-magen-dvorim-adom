import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  test: {
    environment: "jsdom",
    globals: true,

    // Look for all test files inside src/tests
    include: ["src/tests/**/*.{test,spec}.js"],
  },
});