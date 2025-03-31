import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom', // Revert back to jsdom
    setupFiles: './vitest.setup.ts', // Specify the setup file
    alias: {
      '@': path.resolve(__dirname, './src'), // Configure the path alias
    },
    // Optional: Add coverage configuration if needed later
    // coverage: {
    //   provider: 'v8', // or 'istanbul'
    //   reporter: ['text', 'json', 'html'],
    // },
  },
});