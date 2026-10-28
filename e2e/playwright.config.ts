import type { Project } from "@playwright/test"
import { defineConfig, devices } from "@playwright/test"

const baseURL = process.env.E2E_BASE_URL

if (baseURL === undefined || baseURL.length === 0) {
  throw new Error("E2E_BASE_URL must name the backoffice under test, for instance https://backoffice.localhost:8443")
}

const hostResolverRules = process.env.E2E_HOST_RESOLVER_RULES
const torProxy = process.env.E2E_TOR_PROXY ?? ""
const throughTor = torProxy.length > 0

function projects(): Project[] {
  if (!throughTor) {
    return [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
  }

  return [
    {
      name: "firefox-onion",
      use: {
        ...devices["Desktop Firefox"],
        launchOptions: {
          proxy: { server: torProxy },
          firefoxUserPrefs: {
            "dom.securecontext.allowlist_onions": true,
            "network.proxy.socks_remote_dns": true,
            "security.mixed_content.upgrade_display_content": false
          }
        }
      }
    }
  ]
}

const config = defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  outputDir: "../dist/e2e",
  timeout: throughTor ? 180_000 : 30_000,
  expect: { timeout: throughTor ? 30_000 : 5_000 },
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
  projects: projects()
})

export default config
