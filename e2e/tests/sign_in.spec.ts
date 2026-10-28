import { expect, type Page, test } from "@playwright/test"
import { requiredEnv } from "../support/required_env"
import { totpCode } from "../support/totp_code"
import { watchPage } from "../support/watch_page"

const adminEmail = requiredEnv("E2E_ADMIN_EMAIL")
const adminPassword = requiredEnv("E2E_ADMIN_PASSWORD")
const customerEmail = requiredEnv("E2E_CUSTOMER_EMAIL")
const customerPassword = requiredEnv("E2E_CUSTOMER_PASSWORD")

test.describe.configure({ mode: "serial" })

async function submitPassword(page: Page, email: string, password: string): Promise<void> {
  await page.getByLabel(/^Email/).fill(email)
  await page.getByLabel(/^Password/).fill(password)
  await page.getByRole("button", { name: "Continue" }).click()
}

test("identity's refusals reach the admin as words, not as a blank page", async ({ page }) => {
  await page.goto("/sign-in")
  await submitPassword(page, adminEmail, `${adminPassword}-wrong`)
  await expect(page.getByRole("alert")).toHaveText("The email or the password is not correct.")

  await page.goto("/sign-in")
  await submitPassword(page, customerEmail, customerPassword)
  await expect(page.getByRole("alert")).toHaveText("This account cannot use the backoffice.")
})

test("an admin enrols a second factor, signs in with it and signs out", async ({ page, context }) => {
  const problems = watchPage(page)

  await page.goto("/")
  await expect(page).toHaveURL(/\/sign-in\?redirect=%2F$/)
  await submitPassword(page, adminEmail, adminPassword)

  await expect(page.getByRole("heading", { name: "Set up two-factor authentication" })).toBeVisible()
  await expect(page.getByRole("img", { name: "QR code for an authenticator app" })).toBeVisible()
  const secret = ((await page.locator("code").textContent()) ?? "").replace(/\s/g, "")
  expect(secret).toMatch(/^[A-Z2-7]{16,}=*$/)
  await page.getByLabel(/^Code/).fill(totpCode(secret, 0))
  await page.getByRole("button", { name: "Turn on" }).click()
  await expect(page.getByRole("status")).toContainText("Two-factor authentication is on.")

  await submitPassword(page, adminEmail, adminPassword)
  await expect(page.getByRole("heading", { name: "Enter the code" })).toBeVisible()
  await page.getByLabel(/^Code/).fill(totpCode(secret, 30))
  await page.getByRole("button", { name: "Sign in" }).click()

  await expect(page.getByRole("heading", { name: "Your account" })).toBeVisible()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText(adminEmail)).toBeVisible()
  await expect(page.locator("dd").filter({ hasText: /^admin$/ })).toBeVisible()

  const session = (await context.cookies()).find((cookie) => cookie.name === "__Host-kx_session")
  expect(session).toMatchObject({ httpOnly: true, secure: true, sameSite: "Strict", path: "/", expires: -1 })
  expect(await page.evaluate(() => document.cookie)).not.toContain("kx_session")

  await page.getByRole("button", { name: "Sign out" }).click()
  await expect(page).toHaveURL(/\/sign-in\?notice=signed-out$/)
  await page.goto("/")
  await expect(page).toHaveURL(/\/sign-in\?redirect=%2F$/)
  expect((await context.cookies()).some((cookie) => cookie.name === "__Host-kx_session")).toBe(false)

  expect(problems).toEqual([])
})
