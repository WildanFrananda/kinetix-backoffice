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

async function forgetPasskey(rpId: string, credentialId: string): Promise<void> {
  if (!supportsPasskeys() || typeof PublicKeyCredential.signalUnknownCredential !== "function") {
    return
  }

  await PublicKeyCredential.signalUnknownCredential({ rpId, credentialId }).catch(() => undefined)
}

async function keepOnlyPasskeys(principalId: string, credentialIds: readonly string[]): Promise<void> {
  if (!supportsPasskeys() || typeof PublicKeyCredential.signalAllAcceptedCredentials !== "function") {
    return
  }

  await PublicKeyCredential.signalAllAcceptedCredentials({
    rpId: window.location.hostname,
    userId: userHandleOf(principalId),
    allAcceptedCredentialIds: [...credentialIds]
  }).catch(() => undefined)
}

function userHandleOf(principalId: string): string {
  const bytes = new TextEncoder().encode(principalId)

  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "")
}

function passkeyDeclined(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const code = (error as Error & { code?: unknown }).code

  return error.name === "NotAllowedError" || error.name === "AbortError" || code === "ERROR_CEREMONY_ABORTED"
}

function passkeyElsewhere(error: unknown): boolean {
  return error instanceof Error && error.name === "SecurityError"
}

function passkeyAlreadyHere(error: unknown): boolean {
  return (
    error instanceof Error && (error as Error & { code?: unknown }).code === "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED"
  )
}

export {
  askForPasskey,
  forgetPasskey,
  keepOnlyPasskeys,
  makePasskey,
  passkeyAlreadyHere,
  passkeyDeclined,
  passkeyElsewhere,
  supportsPasskeys,
  userHandleOf
}
