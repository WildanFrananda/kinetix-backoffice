import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const config = defineConfig({
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true
  },
  build: {
    sourcemap: false,
    assetsInlineLimit: 0
  },
  plugins: [
    tanstackStart({
      spa: {
        enabled: true,
        prerender: {
          outputPath: "/index.html",
          crawlLinks: false
        }
      }
    }),
    viteReact()
  ]
})

export default config
