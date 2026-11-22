import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import solid from "vite-plugin-solid"

export default defineConfig({
  server: {
    proxy: {
      "/ws": {
        target: "ws://localhost:8080/",
        rewriteWsOrigin: true,
        changeOrigin: true,
        ws: true,
      },
      "/api": {
        target: "http://localhost:8080/",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    solid(),
    VitePWA({
      devOptions: { enabled: true },
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot}"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB, for caching font
      },
      manifest: {
        name: "GoTerm",
        start_url: "./",
        short_name: "GoTerm",
        display: "standalone",
        background_color: "#1C1C1C",
        // @ts-ignore
        display_override: ["tabbed"],
        tab_strip: {
          home_tab: {
            scope_patterns: [{ pathname: "./" }],
          },
          new_tab_button: {
            url: "terminal",
          },
        },
        icons: [
          {
            sizes: "512x512",
            src: "icon-512.png",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            sizes: "512x512",
            src: "icon-monochrome-512.png",
            type: "image/png",
            purpose: "monochrome",
          },
        ],
      },
    }),
  ],
})
