import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import solid from 'vite-plugin-solid'

export default defineConfig({
  server: {
    proxy: {
      '/ws': {
        target: 'ws://localhost:8080',
        rewriteWsOrigin: true,
        changeOrigin: true,
        ws: true
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  },
  plugins: [
    solid(),
    VitePWA({
      devOptions: { enabled: true },
      registerType: "autoUpdate",
      manifest: {
        name: "GoTerm",
        start_url: "./",
        short_name: "GoTerm",
        display: "standalone",
        // @ts-ignore
        display_override: ["tabbed"],
        tab_strip: {
          home_tab: {
            scope_patterns: [
              { pathname: "./" }
            ]
          },
          new_tab_button: {
            url: "terminal"
          }
        },
        theme_color: "#ededed",
        background_color: "#ffffff",
        icons: [
          {
            sizes: "512x512",
            src: "icon-512.png",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});

