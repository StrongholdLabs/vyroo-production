import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// import { componentTagger } from "lovable-tagger";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";

const isElectron = !!process.env.ELECTRON;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: isElectron ? "./" : "/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    // mode === "development" && componentTagger(),
    isElectron &&
      electron([
        {
          entry: "electron/main.ts",
          vite: {
            build: {
              outDir: "dist-electron",
              rollupOptions: {
                external: ["electron"],
              },
            },
          },
        },
        {
          entry: "electron/preload.ts",
          onstart({ reload }) {
            reload();
          },
          vite: {
            build: {
              outDir: "dist-electron",
              rollupOptions: {
                external: ["electron"],
              },
            },
          },
        },
      ]),
    isElectron && renderer(),
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
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-tooltip", "@radix-ui/react-popover"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-supabase": ["@supabase/supabase-js"],
        },
      },
    },
  },
}));
