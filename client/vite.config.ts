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
  };
});
