import { defineConfig } from "vitest/config"

const config = defineConfig({
  test: {
    include: ["tests/contract/**/*.test.ts"],
    environment: "node"
  }
})

export default config
