
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./"),
      },
    },
    define: {
      // API Keys Mapping
      'process.env.GOOGLE_API_KEY': JSON.stringify(env.GOOGLE_API_KEY || env.VITE_GOOGLE_API_KEY || 'AIzaSyBQ0ZwOg0rIwhJvx4wIWrKAA5f_BjK9lyQ'),
      'process.env.API_KEY': JSON.stringify(env.GOOGLE_API_KEY || env.VITE_GOOGLE_API_KEY || 'AIzaSyBQ0ZwOg0rIwhJvx4wIWrKAA5f_BjK9lyQ'),
      'process.env.TAVILY_API_KEY': JSON.stringify(env.TAVILY_API_KEY || env.VITE_TAVILY_API_KEY || ''),
      'process.env.EXA_API_KEY': JSON.stringify(env.EXA_API_KEY || env.VITE_EXA_API_KEY || '32685eab-b7b5-4b33-b90d-3569b6e07958'),
      'process.env.OPENROUTER_API_KEY': JSON.stringify(env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY || ''),
      'process.env.CEREBRAS_API_KEY': JSON.stringify(env.CEREBRAS_API_KEY || env.VITE_CEREBRAS_API_KEY || ''),
      'process.env.GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY || env.VITE_GROQ_API_KEY || ''),
      'process.env.FIRECRAWL_API_KEY': JSON.stringify(env.FIRECRAWL_API_KEY || env.VITE_FIRECRAWL_API_KEY || 'fc-6036ccf6936a4a45b5bb4b17f71f9147'),
      'process.env.SUPADATA_API_KEY': JSON.stringify(env.SUPADATA_API_KEY || env.VITE_SUPADATA_API_KEY || 'sd_576bf7d5603eab119c617735d5662202'),
      'process.env.VALYU_API_KEY': JSON.stringify(env.VALYU_API_KEY || env.VITE_VALYU_API_KEY || 'val_6cba2a39741d3f1014b49b941c883abc178c297532636a1340e03ee8af741fae'),
      'process.env.SUPERMEMORY_API_KEY': JSON.stringify(env.SUPERMEMORY_API_KEY || env.VITE_SUPERMEMORY_API_KEY || 'sm_T37sH2N8s9aHEY8p7ZqDeE_fMxvgxKzTTsfpHYQMoKOmdziRHUBBRLHryUYZmXIIqMRdmVsQbeFNUwnxGHrlUjJ'),
    },
    server: {
      port: 3000,
    }
  };
});
