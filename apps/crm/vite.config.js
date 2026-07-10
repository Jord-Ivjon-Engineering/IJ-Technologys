import { defineConfig, loadEnv } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '../..'), '');
  return {
    base: '/crm/',
    envDir: path.resolve(__dirname, '../..'),
    envPrefix: ['VITE_', 'SUPABASE_'],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
        env.VITE_SUPABASE_URL || env.SUPABASE_URL || ''
      ),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
        env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || ''
      ),
      'import.meta.env.VITE_CRM_IDLE_TIMEOUT_MS': JSON.stringify(
        env.VITE_CRM_IDLE_TIMEOUT_MS || ''
      ),
      'import.meta.env.VITE_CRM_AUTH_SELF_TEST': JSON.stringify(
        env.VITE_CRM_AUTH_SELF_TEST || ''
      ),
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
  };
});
