import { defineConfig, devices } from "@playwright/test"

const baseURL = process.env.E2E_BASE_URL

if (baseURL === undefined || baseURL.length === 0) {
  throw new Error("E2E_BASE_URL must name the backoffice under test, for instance https://backoffice.localhost:8443")
}

const hostResolverRules = process.env.E2E_HOST_RESOLVER_RULES

const config = defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  outputDir: "../dist/e2e",
  use: {
    baseURL,
    ignoreHTTPSErrors: process.env.E2E_IGNORE_HTTPS_ERRORS === "1",
    locale: "en-US",
    launchOptions: {
      args:
        hostResolverRules === undefined || hostResolverRules.length === 0
          ? []
          : [`--host-resolver-rules=${hostResolverRules}`]
    },
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
})

export default config
