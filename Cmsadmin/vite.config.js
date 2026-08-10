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
      // Teruskan permintaan gambar artikel (/storage/...) ke backend,
      // sehingga gambar yang di-upload & disimpan di produksi dapat
      // dimuat lewat proxy saat mode development tanpa CORS/ERR_CONNECTION_REFUSED.
      '/storage': {
        // eslint-disable-next-line no-undef
        target: 'https://citra.faaruq.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
