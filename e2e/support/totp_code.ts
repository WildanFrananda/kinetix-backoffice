import { TOTP } from "otpauth"

function totpCode(secret: string, offsetSeconds: number): string {
  const totp = new TOTP({ secret, algorithm: "SHA1", digits: 6, period: 30 })
  return totp.generate({ timestamp: Date.now() + offsetSeconds * 1000 })
}

export { totpCode }
