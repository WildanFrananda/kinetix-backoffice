import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig, type ProxyOptions } from "vite"

const labFace = "https://backoffice.localhost:8443"

function bffProxy(): Record<string, ProxyOptions> {
  const target = process.env.KINETIX_BFF_TARGET
  if (target === undefined || target.length === 0) {
    return {}
  }

  const face = new URL(process.env.KINETIX_BFF_FACE ?? labFace)

  return {
    "/bff": {
      target,
      secure: false,
      ws: true,
      headers: { host: face.host, origin: face.origin }
    }
  }
}

const config = defineConfig({
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    proxy: bffProxy()
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
