import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite';
import path from "path";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react(), tailwindcss(), {
    // Experimental issue #64 adapter: Arborist does not expose its default
    // container's list through a public API, so replace this internal import.
    name: "delta-stable-arborist-rows",
    enforce: "pre" as const,
    transform(code: string, id: string) {
      if (id.endsWith("react-arborist/dist/module/components/default-container.js")) {
        const originalImport = 'from "react-window"';
        if (!code.includes(originalImport)) {
          throw new Error("Arborist's internal list import changed; update the issue #64 adapter");
        }
        return code.replace(originalImport, 'from "@/components/stable-fixed-size-list"');
      }
    },
  }],


  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
