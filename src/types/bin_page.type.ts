import type { WarehouseBin } from "./warehouse_bin.type"

type BinPage = {
  bins: WarehouseBin[]
  nextAfter: string | null
}

export type { BinPage }
