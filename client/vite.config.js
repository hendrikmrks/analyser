import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const certDir = path.resolve(rootDir, 'certs');
const keyPath = path.join(certDir, 'localhost-key.pem');
const certPath = path.join(certDir, 'localhost-cert.pem');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '');
  const useHttps = env.USE_HTTPS === 'true' && fs.existsSync(keyPath) && fs.existsSync(certPath);
  const apiTarget = useHttps ? 'https://127.0.0.1:3001' : 'http://127.0.0.1:3001';

  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      https: useHttps
        ? { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }
        : false,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
