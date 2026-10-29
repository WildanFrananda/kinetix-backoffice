import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { SecurityPanel } from "../../src/features/passkeys/SecurityPanel"
import { AppProviders, testQueryClient } from "../support/app_providers"
import { axeViolations } from "../support/axe"
import { fakeBff } from "../support/fake_bff"

const ceremony = vi.hoisted(() => ({ startAuthentication: vi.fn(), startRegistration: vi.fn() }))

vi.mock("@simplewebauthn/browser", () => ceremony)

let bff = fakeBff({})

class WebAuthnCredential {}

const macbook = {
  id: "5b7c1e2a-9d3f-4a8b-b6c4-2e1f0a9d8c7b",
  name: "MacBook Touch ID",
  createdAt: "2026-10-28T09:00:00.000Z",
  lastUsedAt: "2026-10-29T08:00:00.000Z",
  deviceType: "multiDevice",
  backedUp: true
}

const creation = {
  rp: { id: "backoffice.localhost", name: "Kinetix Backoffice" },
  user: { id: "dXNlcg", name: "admin@example.com", displayName: "admin@example.com" },
  challenge: "Zm9vYmFy",
  pubKeyCredParams: [
    { alg: -7, type: "public-key" },
    { alg: -257, type: "public-key" }
  ],
  timeout: 120_000,
  excludeCredentials: [],
  authenticatorSelection: { residentKey: "preferred", userVerification: "required" },
  attestation: "none"
}

const registration = {
  id: "c3d4",
  rawId: "c3d4",
  type: "public-key",
  response: { clientDataJSON: "e30", attestationObject: "o2Nm", transports: ["internal"] },
  clientExtensionResults: {}
}

beforeEach(() => {
  vi.stubGlobal("PublicKeyCredential", WebAuthnCredential)
  ceremony.startRegistration.mockReset()
})

afterEach(() => {
  expect(bff.unexpected).toEqual([])
  vi.unstubAllGlobals()
})

function show() {
  return render(
    <AppProviders client={testQueryClient()}>
      <SecurityPanel userId={7} />
    </AppProviders>
  )
}

describe("the security panel", () => {
  it("shows the code as always on and lists the passkeys, accessibly", async () => {
    bff = fakeBff({ "GET /bff/api/v1/auth/passkeys/7": () => Response.json({ passkeys: [macbook] }) })

    const { container } = show()

    expect(await screen.findByText("MacBook Touch ID")).toBeInTheDocument()
    expect(screen.getByText("On")).toBeInTheDocument()
    expect(screen.getByText(/synced/)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Turn off|Switch off/ })).not.toBeInTheDocument()
    expect(await axeViolations(container)).toEqual([])
  })

  it("adds a passkey with a name and the password", async () => {
    let listed = [] as (typeof macbook)[]
    bff = fakeBff({
      "GET /bff/api/v1/auth/passkeys/7": () => Response.json({ passkeys: listed }),
      "POST /bff/api/v1/auth/passkeys/7/options": () => Response.json({ challengeId: "ch-1", options: creation }),
      "POST /bff/api/v1/auth/passkeys/7": () => {
        listed = [macbook]

        return Response.json(macbook, { status: 201 })
      }
    })

    ceremony.startRegistration.mockResolvedValue(registration)

    const user = userEvent.setup()
    show()
    expect(await screen.findByText("No passkey yet. You sign in with the code.")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Add a passkey" }))

    const dialog = await screen.findByRole("dialog", { name: "Add a passkey" })
    await user.type(within(dialog).getByRole("textbox", { name: "Name" }), "MacBook Touch ID")
    await user.type(within(dialog).getByLabelText(/^Password/), "correct horse")
    await user.click(within(dialog).getByRole("button", { name: "Add passkey" }))

    expect(await screen.findByText("Added “MacBook Touch ID”. Your next sign-in can use it.")).toBeInTheDocument()
    expect(ceremony.startRegistration).toHaveBeenCalledWith({ optionsJSON: creation })
    expect(bff.seen.find((request) => request.route === "POST /bff/api/v1/auth/passkeys/7")?.body).toEqual({
      challengeId: "ch-1",
      name: "MacBook Touch ID",
      password: "correct horse",
      credential: registration
    })

    await waitFor(() => expect(screen.getByText("MacBook Touch ID")).toBeInTheDocument())
  })

  it("removes a passkey after the password, Cancel offered first", async () => {
    let listed = [macbook]
    bff = fakeBff({
      "GET /bff/api/v1/auth/passkeys/7": () => Response.json({ passkeys: listed }),
      [`DELETE /bff/api/v1/auth/passkeys/7/${macbook.id}`]: () => {
        listed = []

        return new Response(null, { status: 204 })
      }
    })

    const user = userEvent.setup()
    show()
    await user.click(await screen.findByRole("button", { name: "Remove MacBook Touch ID" }))

    const dialog = await screen.findByRole("dialog", { name: "Remove “MacBook Touch ID”?" })
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus()
    await user.type(within(dialog).getByLabelText(/^Password/), "correct horse")
    await user.click(within(dialog).getByRole("button", { name: "Remove" }))

    expect(await screen.findByText("Removed “MacBook Touch ID”.")).toBeInTheDocument()
    expect(bff.seen.find((request) => request.route.startsWith("DELETE"))?.body).toEqual({ password: "correct horse" })
  })

  it("says a wrong password plainly and adds nothing", async () => {
    bff = fakeBff({
      "GET /bff/api/v1/auth/passkeys/7": () => Response.json({ passkeys: [] }),
      "POST /bff/api/v1/auth/passkeys/7/options": () => Response.json({ challengeId: "ch-2", options: creation }),
      "POST /bff/api/v1/auth/passkeys/7": () =>
        Response.json(
          { message: "Invalid email or password credentials", error: "Unauthorized", statusCode: 401 },
          { status: 401 }
        )
    })

    ceremony.startRegistration.mockResolvedValue(registration)

    const user = userEvent.setup()
    show()
    await user.click(await screen.findByRole("button", { name: "Add a passkey" }))
    const dialog = await screen.findByRole("dialog")
    await user.type(within(dialog).getByRole("textbox", { name: "Name" }), "MacBook")
    await user.type(within(dialog).getByLabelText(/^Password/), "wrong horse")
    await user.click(within(dialog).getByRole("button", { name: "Add passkey" }))

    expect(await within(dialog).findByText("That password is not right.")).toBeInTheDocument()
  })

  it("says the passkey belongs to another address when the browser refuses this one, and sends nothing", async () => {
    bff = fakeBff({
      "GET /bff/api/v1/auth/passkeys/7": () => Response.json({ passkeys: [] }),
      "POST /bff/api/v1/auth/passkeys/7/options": () => Response.json({ challengeId: "ch-4", options: creation })
    })

    ceremony.startRegistration.mockRejectedValue(
      Object.assign(new Error("The RP ID is invalid for this domain"), {
        name: "SecurityError",
        code: "ERROR_INVALID_RP_ID"
      })
    )

    const user = userEvent.setup()
    show()
    await user.click(await screen.findByRole("button", { name: "Add a passkey" }))
    const dialog = await screen.findByRole("dialog")
    await user.type(within(dialog).getByRole("textbox", { name: "Name" }), "MacBook")
    await user.type(within(dialog).getByLabelText(/^Password/), "correct horse")
    await user.click(within(dialog).getByRole("button", { name: "Add passkey" }))

    expect(await within(dialog).findByText(/passkeys belong to the backoffice's own address/)).toBeInTheDocument()
    expect(bff.seen.map((request) => request.route)).not.toContain("POST /bff/api/v1/auth/passkeys/7")
  })

  it("says when identity cannot verify the device's answer, and when the request expired", async () => {
    const answers = [
      {
        error: "PASSKEY_INVALID",
        message: "The authenticator's answer could not be verified, so no passkey was added."
      },
      { error: "PASSKEY_CHALLENGE_INVALID", message: "That passkey challenge is unknown, expired or already used." }
    ]

    bff = fakeBff({
      "GET /bff/api/v1/auth/passkeys/7": () => Response.json({ passkeys: [] }),
      "POST /bff/api/v1/auth/passkeys/7/options": () => Response.json({ challengeId: "ch-3", options: creation }),
      "POST /bff/api/v1/auth/passkeys/7": () => Response.json({ ...answers.shift(), traceId: "t-1" }, { status: 400 })
    })

    ceremony.startRegistration.mockResolvedValue(registration)

    const user = userEvent.setup()
    show()
    await user.click(await screen.findByRole("button", { name: "Add a passkey" }))
    const dialog = await screen.findByRole("dialog")
    await user.type(within(dialog).getByRole("textbox", { name: "Name" }), "MacBook")
    await user.type(within(dialog).getByLabelText(/^Password/), "correct horse")
    await user.click(within(dialog).getByRole("button", { name: "Add passkey" }))

    expect(await within(dialog).findByText(/could not verify the device's answer/)).toBeInTheDocument()

    await user.click(within(dialog).getByRole("button", { name: "Add passkey" }))

    expect(await within(dialog).findByText(/the request expired/)).toBeInTheDocument()
    expect(bff.seen.filter((request) => request.route === "POST /bff/api/v1/auth/passkeys/7/options")).toHaveLength(2)
  })

  it("cannot add a passkey where the browser has none, and says how to switch it on in Tor Browser", async () => {
    vi.stubGlobal("PublicKeyCredential", undefined)
    bff = fakeBff({ "GET /bff/api/v1/auth/passkeys/7": () => Response.json({ passkeys: [] }) })

    show()

    expect(await screen.findByText(/security\.webauth\.webauthn/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add a passkey" })).toBeDisabled()
  })
})
