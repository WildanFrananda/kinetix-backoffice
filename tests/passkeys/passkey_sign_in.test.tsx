import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { SignInFlow } from "../../src/features/sign_in/SignInFlow"
import { adminSession, edgeRefusal } from "../support/edge_answers"
import { fakeBff } from "../support/fake_bff"

const ceremony = vi.hoisted(() => ({ startAuthentication: vi.fn(), startRegistration: vi.fn() }))

vi.mock("@simplewebauthn/browser", () => ceremony)

let bff = fakeBff({})

class WebAuthnCredential {}

const options = {
  challenge: "q8YnDJ4XzC0Yb2k3Vd9zUQ",
  timeout: 120_000,
  rpId: "backoffice.localhost",
  allowCredentials: [{ id: "a1b2c3", type: "public-key", transports: ["internal"] }],
  userVerification: "required"
}

const assertion = {
  id: "a1b2c3",
  rawId: "a1b2c3",
  type: "public-key",
  response: { clientDataJSON: "e30", authenticatorData: "AAAA", signature: "BBBB", userHandle: "dXNlcg" },
  clientExtensionResults: {}
}

beforeEach(() => {
  vi.stubGlobal("PublicKeyCredential", WebAuthnCredential)
  ceremony.startAuthentication.mockReset()
})

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

describe("signing in with a passkey", () => {
  it("offers the passkey first and signs in with it", async () => {
    bff = fakeBff({
      "POST /bff/login": () => Response.json({ mfaRequired: true, passkeys: true }),
      "POST /bff/2fa/passkey/options": () => Response.json({ options }),
      "POST /bff/2fa/passkey/verify": () => Response.json(adminSession())
    })

    ceremony.startAuthentication.mockResolvedValue(assertion)

    const onSignedIn = vi.fn()
    render(<SignInFlow notice={null} onSignedIn={onSignedIn} />)
    const user = await signInWithPassword()
    await user.click(await screen.findByRole("button", { name: "Use a passkey" }))

    await waitFor(() => expect(onSignedIn).toHaveBeenCalledOnce())
    expect(ceremony.startAuthentication).toHaveBeenCalledWith({ optionsJSON: options })
    expect(bff.seen.map((request) => request.route)).toEqual([
      "POST /bff/login",
      "POST /bff/2fa/passkey/options",
      "POST /bff/2fa/passkey/verify"
    ])

    expect(bff.seen[2]?.body).toEqual({ credential: assertion })
  })

  it("keeps the code when the device declines, and when the edge refuses the passkey", async () => {
    let verified = 0
    bff = fakeBff({
      "POST /bff/login": () => Response.json({ mfaRequired: true, passkeys: true }),
      "POST /bff/2fa/passkey/options": () => Response.json({ options }),
      "POST /bff/2fa/passkey/verify": () => {
        verified += 1

        return edgeRefusal(401, "PASSKEY_REFUSED")
      }
    })

    ceremony.startAuthentication.mockRejectedValueOnce(
      Object.assign(new Error("declined"), { name: "NotAllowedError" })
    )

    ceremony.startAuthentication.mockResolvedValueOnce(assertion)

    render(<SignInFlow notice={null} onSignedIn={vi.fn()} />)
    const user = await signInWithPassword()
    await user.click(await screen.findByRole("button", { name: "Use a passkey" }))
    expect(await screen.findByText("The passkey was not used. Try again, or enter the code.")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Use a passkey" }))
    expect(await screen.findByText("That passkey was not accepted. Try again, or enter the code.")).toBeInTheDocument()
    expect(verified).toBe(1)
    expect(screen.getByLabelText(/^Code/)).toBeInTheDocument()
  })

  it("falls back to the code when the browser cannot hold a passkey for this address, as on the WireGuard IP", async () => {
    bff = fakeBff({
      "POST /bff/login": () => Response.json({ mfaRequired: true, passkeys: true }),
      "POST /bff/2fa/passkey/options": () => Response.json({ options })
    })

    ceremony.startAuthentication.mockRejectedValue(
      Object.assign(new Error("invalid domain"), { name: "SecurityError", code: "ERROR_INVALID_DOMAIN" })
    )

    render(<SignInFlow notice={null} onSignedIn={vi.fn()} />)
    const user = await signInWithPassword()
    await user.click(await screen.findByRole("button", { name: "Use a passkey" }))

    expect(
      await screen.findByText("This browser could not use a passkey at this address. Enter the code instead.")
    ).toBeInTheDocument()

    expect(screen.getByLabelText(/^Code/)).toBeInTheDocument()
  })

  it("offers only the code when the account has no passkey, or the edge does not say", async () => {
    bff = fakeBff({ "POST /bff/login": () => Response.json({ mfaRequired: true }) })

    render(<SignInFlow notice={null} onSignedIn={vi.fn()} />)
    await signInWithPassword()

    expect(await screen.findByRole("heading", { name: "Enter the code" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Use a passkey" })).not.toBeInTheDocument()
  })

  it("says the browser cannot use the passkey where WebAuthn is off, as in Tor Browser by default", async () => {
    vi.stubGlobal("PublicKeyCredential", undefined)
    bff = fakeBff({ "POST /bff/login": () => Response.json({ mfaRequired: true, passkeys: true }) })

    render(<SignInFlow notice={null} onSignedIn={vi.fn()} />)
    await signInWithPassword()

    expect(await screen.findByText(/this browser cannot use it here/)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Use a passkey" })).not.toBeInTheDocument()
  })
})
