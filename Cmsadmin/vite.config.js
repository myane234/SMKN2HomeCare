import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
server: {
    proxy: {
      // Rute API Ulasan & Hubungi Kami diarahkan ke API aktif di port 3000
      '/api/resource/content/ulasan': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api/admin/ulasan': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api/resource/content/hubungi-kami': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api/admin/hubungi-kami': {
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
