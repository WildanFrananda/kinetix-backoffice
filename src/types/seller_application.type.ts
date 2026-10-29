type SellerApplication = {
  applicationId: number
  userId: number
  principalId: string | null
  email: string
  storeName: string
  businessRegistrationNumber: string
  taxId: string
  streetAddress: string
  city: string
  postalCode: string
  status: "pending" | "verified" | "rejected"
  verifiedAt: Date | null
}

export type { SellerApplication }
