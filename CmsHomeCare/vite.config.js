import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        // eslint-disable-next-line no-undef
        target: 'https://citra.faaruq.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
