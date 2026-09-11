import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
server: {
    proxy: {
      // Teruskan seluruh request /api langsung ke backend produksi citra.faaruq.com
      '/api': {
        target: 'https://citra.faaruq.com',
        changeOrigin: true,
        secure: false,
      },
      // Teruskan permintaan gambar artikel (/storage/...) ke backend produksi
      '/storage': {
        target: 'https://citra.faaruq.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
