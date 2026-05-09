import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';

// Run with HTTPS=true npm run dev  (or npm run dev:https) to enable HTTPS
// HTTPS is required for geolocation on non-localhost devices (phones on LAN)
const useHttps = process.env.HTTPS === 'true';

export default defineConfig({
  plugins: useHttps ? [react(), basicSsl()] : [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,   // expose on LAN — phone can access via Network URL
    port: 5173,
    ...(useHttps ? { https: true } : {}),
    proxy: {
      // Proxy /api/* to backend so mobile (HTTPS) can reach HTTP backend without mixed-content errors
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
