import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
server: {
    proxy: {
      // Rute Hubungi Kami & Forgot Password diarahkan ke port 3000 jika diperlukan
      '/api/resource/content/hubungi-kami': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api/admin/hubungi-kami': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api/admin/forgot-password': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api/forgot-password': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
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
