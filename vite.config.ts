import { localIconPlugin } from "./scripts/local-icon-plugin";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig(({ command }) => ({
  base: "./",
  optimizeDeps: { entries: ["index.html", "player.html"] },
  plugins: [
    localIconPlugin(command),
    react(),
    VitePWA({
      registerType: "prompt",
      manifest: {
        name: "捡手机 FoundPhone Studio",
        short_name: "捡手机",
        theme_color: "#f5f4f0",
        background_color: "#f5f4f0",
        display: "standalone",
        icons: [
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg}"],
        maximumFileSizeToCacheInBytes: 6000000,
      },
    }),
  ],
}));
