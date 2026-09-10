import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Container-safe Vite config. The encrypted host config is excluded from the
// Docker build context so it is never copied into the build image.
export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173 },
});
