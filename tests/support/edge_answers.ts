const requestId = "6f1c2b9e-3d4a-4f5e-8a7b-9c0d1e2f3a4b"

function edgeRefusal(status: number, error: string, headers: Record<string, string> = {}): Response {
  return Response.json({ error, message: "refused", requestId }, { status, headers })
}

function adminSession() {
  return {
    authenticated: true,
    role: "admin",
    principalId: "3c9d2e7a-6b1f-4d8e-a5c4-7e2f1b0a9d8c",
    expiresAt: "2026-10-26T08:15:00.000Z"
  }
}

const enrolmentSecret = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP"

function enrolmentSetup() {
  return {
    twoFactorSecret: enrolmentSecret,
    qrCodeUrl: `otpauth://totp/Kinetix%3Aadmin%40example.com?secret=${enrolmentSecret}&issuer=Kinetix&algorithm=SHA1&digits=6&period=30`,
    enabled: false
  }
}

export { adminSession, edgeRefusal, enrolmentSecret, enrolmentSetup }
