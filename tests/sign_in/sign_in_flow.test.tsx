import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { SignInFlow } from "../../src/features/sign_in/SignInFlow"
import { adminSession, edgeRefusal, enrolmentSetup } from "../support/edge_answers"
import { fakeBff } from "../support/fake_bff"

let bff = fakeBff({})

afterEach(() => {
  expect(bff.unexpected).toEqual([])
  vi.unstubAllGlobals()
})

async function signInWithPassword() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/^Email/), "admin@example.com")
  await user.type(screen.getByLabelText(/^Password/), "correct horse")
  await user.click(screen.getByRole("button", { name: "Continue" }))
  return user
}

describe("SignInFlow", () => {
  it("refuses an empty form before anything is sent", async () => {
    bff = fakeBff({})
    render(<SignInFlow notice={null} onSignedIn={vi.fn()} />)
    await userEvent.setup().click(screen.getByRole("button", { name: "Continue" }))
    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument()
    expect(screen.getByText("Enter the password, at least 6 characters.")).toBeInTheDocument()
    expect(bff.seen).toEqual([])
  })

  it("signs an admin in with a password and a code", async () => {
    bff = fakeBff({
      "POST /bff/login": () => Response.json({ mfaRequired: true }),
      "POST /bff/2fa/verify": () => Response.json(adminSession())
    })
    const onSignedIn = vi.fn()
    render(<SignInFlow notice={null} onSignedIn={onSignedIn} />)
    const user = await signInWithPassword()
    expect(await screen.findByRole("heading", { name: "Enter the code" })).toBeInTheDocument()
    expect(screen.getByText(/^This step ends in [45]:\d\d\.$/)).toBeInTheDocument()
    await user.type(screen.getByLabelText(/^Code/), " 123 456 ")
    await user.click(screen.getByRole("button", { name: "Sign in" }))
    await waitFor(() => expect(onSignedIn).toHaveBeenCalledOnce())
    expect(onSignedIn.mock.calls[0]?.[0]).toMatchObject({ authenticated: true, role: "admin" })
    expect(bff.seen).toEqual([
      { route: "POST /bff/login", body: { email: "admin@example.com", password: "correct horse" } },
      { route: "POST /bff/2fa/verify", body: { code: "123456" } }
    ])
  })

  it("says the password is wrong and stays on the form", async () => {
    bff = fakeBff({ "POST /bff/login": () => edgeRefusal(401, "SIGN_IN_REFUSED") })
    render(<SignInFlow notice={null} onSignedIn={vi.fn()} />)
    await signInWithPassword()
    expect(await screen.findByText("The email or the password is not correct.")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument()
  })

  it("holds the button while identity delays the account", async () => {
    bff = fakeBff({ "POST /bff/login": () => edgeRefusal(429, "SIGN_IN_DELAYED", { "Retry-After": "30" }) })
    render(<SignInFlow notice={null} onSignedIn={vi.fn()} />)
    await signInWithPassword()
    expect(await screen.findByText(/^Too many unsuccessful attempts on this account\./)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^Try again in (30|29) s$/ })).toBeDisabled()
  })

  it("names a refused role instead of signing in", async () => {
    bff = fakeBff({ "POST /bff/login": () => edgeRefusal(403, "ROLE_REFUSED") })
    render(<SignInFlow notice={null} onSignedIn={vi.fn()} />)
    await signInWithPassword()
    expect(await screen.findByText("This account cannot use the backoffice.")).toBeInTheDocument()
  })

  it("keeps the challenge after a refused code, and leaves it when identity ends it", async () => {
    let verifies = 0
    bff = fakeBff({
      "POST /bff/login": () => Response.json({ mfaRequired: true }),
      "POST /bff/2fa/verify": () => {
        verifies += 1
        return verifies === 1 ? edgeRefusal(401, "CODE_REFUSED") : edgeRefusal(401, "SIGN_IN_REQUIRED")
      }
    })
    render(<SignInFlow notice={null} onSignedIn={vi.fn()} />)
    const user = await signInWithPassword()
    await user.type(await screen.findByLabelText(/^Code/), "111111")
    await user.click(screen.getByRole("button", { name: "Sign in" }))
    expect(await screen.findByText(/^That code was not accepted\./)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Code/)).toHaveValue("")
    await user.type(screen.getByLabelText(/^Code/), "222222")
    await user.click(screen.getByRole("button", { name: "Sign in" }))
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument()
    expect(screen.getByText("The sign-in in progress has ended. Start again.")).toBeInTheDocument()
  })

  it("drops the pending sign-in at the edge when the admin starts over", async () => {
    bff = fakeBff({
      "POST /bff/login": () => Response.json({ mfaRequired: true }),
      "POST /bff/logout": () => new Response(null, { status: 204 })
    })
    render(<SignInFlow notice={null} onSignedIn={vi.fn()} />)
    const user = await signInWithPassword()
    await user.click(await screen.findByRole("button", { name: "Use another account" }))
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument()
    await waitFor(() => expect(bff.seen.map((request) => request.route)).toContain("POST /bff/logout"))
  })

  it("enrols an admin's second factor, then sends them back to sign in", async () => {
    bff = fakeBff({
      "POST /bff/login": () => Response.json({ mfaEnrolmentRequired: true }),
      "POST /bff/2fa/setup": () => Response.json(enrolmentSetup()),
      "POST /bff/2fa/enable": () => Response.json({ enabled: true })
    })
    render(<SignInFlow notice={null} onSignedIn={vi.fn()} />)
    const user = await signInWithPassword()
    expect(await screen.findByRole("heading", { name: "Set up two-factor authentication" })).toBeInTheDocument()
    expect(await screen.findByTitle("QR code for an authenticator app")).toBeInTheDocument()
    expect(screen.getByText("JBSW Y3DP EHPK 3PXP JBSW Y3DP EHPK 3PXP")).toBeInTheDocument()
    await user.type(screen.getByLabelText(/^Code/), "654321")
    await user.click(screen.getByRole("button", { name: "Turn on" }))
    expect(await screen.findByText(/^Two-factor authentication is on\./)).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument()
    expect(bff.seen.filter((request) => request.route === "POST /bff/2fa/setup")).toHaveLength(1)
    expect(bff.seen.at(-1)).toEqual({ route: "POST /bff/2fa/enable", body: { code: "654321" } })
  })

  it("sends an admin who enrolled elsewhere back to sign in with a code", async () => {
    bff = fakeBff({
      "POST /bff/login": () => Response.json({ mfaEnrolmentRequired: true }),
      "POST /bff/2fa/setup": () => edgeRefusal(409, "TWO_FACTOR_ALREADY_ENABLED")
    })
    render(<SignInFlow notice={null} onSignedIn={vi.fn()} />)
    await signInWithPassword()
    expect(await screen.findByText(/^This account already has two-factor authentication\./)).toBeInTheDocument()
  })

  it("refuses an answer it does not know rather than guessing a step", async () => {
    bff = fakeBff({ "POST /bff/login": () => Response.json({ authenticated: true, role: "admin" }) })
    render(<SignInFlow notice={null} onSignedIn={vi.fn()} />)
    await signInWithPassword()
    expect(await screen.findByText(/^The backoffice got an answer it does not expect\./)).toBeInTheDocument()
  })
})
