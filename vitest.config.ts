import viteReact from "@vitejs/plugin-react"
import { configDefaults, defineConfig } from "vitest/config"

const config = defineConfig({
  plugins: [viteReact()],
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    exclude: [...configDefaults.exclude, "tests/contract/**"],
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "https://backoffice.test/"
      }
    },
    setupFiles: ["tests/setup.ts"],
    restoreMocks: true
  }
})

export default config
