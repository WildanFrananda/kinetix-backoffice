type CourierApplication = {
  applicationId: number
  principalId: string
  userId: number
  email: string
  driverId: number | null
  status: "pending" | "approved" | "rejected"
  filedAt: Date
  approvedAt: Date | null
  rejectedAt: Date | null
}

export type { CourierApplication }
