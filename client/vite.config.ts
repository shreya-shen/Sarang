import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Check if SSL certificates exist
  const sslKeyPath = path.resolve(__dirname, "../server/ssl/localhost.key");
  const sslCertPath = path.resolve(__dirname, "../server/ssl/localhost.cert");
  const hasSSL = fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath);

  return {
    server: {
      host: "localhost",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor libraries
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-toast',
              '@radix-ui/react-select',
              '@radix-ui/react-tabs',
              '@radix-ui/react-accordion',
              '@radix-ui/react-avatar',
              '@radix-ui/react-slot',
              '@radix-ui/react-label'
            ],
            'clerk-auth': ['@clerk/clerk-react'],
            'supabase': ['@supabase/supabase-js'],
            'chart-libs': ['recharts'],
            'pdf-libs': ['jspdf', 'html2canvas'],
            'query': ['@tanstack/react-query'],
            'form': ['react-hook-form', '@hookform/resolvers', 'zod'],
            'date': ['date-fns', 'react-day-picker'],
            'utils': ['clsx', 'class-variance-authority', 'tailwind-merge']
          }
        }
      },
      chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
      sourcemap: false // Disable sourcemaps in production for smaller builds
    }
  };
});
