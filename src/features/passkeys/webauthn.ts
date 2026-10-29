import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON
} from "@simplewebauthn/browser"

function supportsPasskeys(): boolean {
  return typeof window !== "undefined" && typeof window.PublicKeyCredential === "function"
}

async function askForPasskey(options: PublicKeyCredentialRequestOptionsJSON): Promise<AuthenticationResponseJSON> {
  const { startAuthentication } = await import("@simplewebauthn/browser")

  return startAuthentication({ optionsJSON: options })
}

async function makePasskey(options: PublicKeyCredentialCreationOptionsJSON): Promise<RegistrationResponseJSON> {
  const { startRegistration } = await import("@simplewebauthn/browser")

  return startRegistration({ optionsJSON: options })
}

function passkeyDeclined(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const code = (error as Error & { code?: unknown }).code

  return error.name === "NotAllowedError" || error.name === "AbortError" || code === "ERROR_CEREMONY_ABORTED"
}

function passkeyAlreadyHere(error: unknown): boolean {
  return (
    error instanceof Error && (error as Error & { code?: unknown }).code === "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED"
  )
}

export { askForPasskey, makePasskey, passkeyAlreadyHere, passkeyDeclined, supportsPasskeys }
