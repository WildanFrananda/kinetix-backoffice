type CourierApplication = {
  applicationId: number
  principalId: string
  userId: number
  email: string
  driverId: number | null
  status: "pending" | "approved"
  filedAt: Date
  approvedAt: Date | null
}

export type { CourierApplication }
