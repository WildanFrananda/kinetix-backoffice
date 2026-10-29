type StockReport =
  | { kind: "received" | "replayed"; bin: string; sku: string; quantity: number; onHand: number }
  | { kind: "adjusted"; bin: string; sku: string; onHand: number }
  | { kind: "savedBin"; bin: string }

export type { StockReport }
