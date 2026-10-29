type StockRow = {
  id: number
  binCode: string
  zone: string
  shelfLevel: number
  sku: string
  merchantPrincipalId: string | null
  quantity: number
  reserved: number
  available: number
  updatedAt: Date
}

export type { StockRow }
