
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Prioritize GOOGLE_API_KEY as that is what is provided in the environment list
      'process.env.API_KEY': JSON.stringify(env.GOOGLE_API_KEY || env.API_KEY || env.VITE_API_KEY || ''),
      'process.env.GOOGLE_API_KEY': JSON.stringify(env.GOOGLE_API_KEY || ''),
      'process.env.GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY || env.VITE_GROQ_API_KEY || ''),
    },
    server: {
      port: 3000,
    }
  };
});
