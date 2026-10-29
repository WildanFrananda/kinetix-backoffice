import * as v from "valibot"
import type { BinPage } from "../../types/bin_page.type"
import type { CatalogProduct } from "../../types/catalog_product.type"
import type { LedgerPage } from "../../types/ledger_page.type"
import type { SavedBin } from "../../types/saved_bin.type"
import type { StockMovement } from "../../types/stock_movement.type"
import type { StockPage } from "../../types/stock_page.type"
import { countSchema } from "./count_schema"
import { instantSchema } from "./instant_schema"

const idSchema = v.pipe(v.number(), v.integer(), v.minValue(1))

const reasonSchema = v.picklist(["DAMAGE", "SHRINKAGE", "MISCOUNT", "RETURN_TO_SUPPLIER", "EXPIRY"])

const binSchema = v.pipe(
  v.object({
    id: idSchema,
    bin_code: v.string(),
    zone: v.string(),
    shelf_level: countSchema,
    sku_count: countSchema,
    quantity: countSchema,
    reserved_quantity: countSchema,
    updated_at: instantSchema
  }),
  v.transform((bin) => ({
    id: bin.id,
    code: bin.bin_code,
    zone: bin.zone,
    shelfLevel: bin.shelf_level,
    skuCount: bin.sku_count,
    quantity: bin.quantity,
    reserved: bin.reserved_quantity,
    updatedAt: bin.updated_at
  }))
)

const binPageSchema = v.pipe(
  v.object({ bins: v.array(binSchema), next_after: v.nullable(v.string()) }),
  v.transform((page): BinPage => ({ bins: page.bins, nextAfter: page.next_after }))
)

const stockRowSchema = v.pipe(
  v.object({
    id: idSchema,
    bin_code: v.string(),
    zone: v.string(),
    shelf_level: countSchema,
    sku: v.string(),
    merchant_principal_id: v.nullable(v.string()),
    quantity: countSchema,
    reserved_quantity: countSchema,
    available_quantity: countSchema,
    updated_at: instantSchema
  }),
  v.transform((row) => ({
    id: row.id,
    binCode: row.bin_code,
    zone: row.zone,
    shelfLevel: row.shelf_level,
    sku: row.sku,
    merchantPrincipalId: row.merchant_principal_id,
    quantity: row.quantity,
    reserved: row.reserved_quantity,
    available: row.available_quantity,
    updatedAt: row.updated_at
  }))
)

const stockPageSchema = v.pipe(
  v.object({ stock: v.array(stockRowSchema), next_after_id: v.nullable(idSchema) }),
  v.transform((page): StockPage => ({ rows: page.stock, nextAfterId: page.next_after_id }))
)

const receiptSchema = v.pipe(
  v.object({
    id: idSchema,
    bin_code: v.string(),
    sku: v.string(),
    merchant_principal_id: v.nullable(v.string()),
    quantity: idSchema,
    note: v.nullable(v.string()),
    received_by_principal_id: v.string(),
    created_at: instantSchema
  }),
  v.transform((receipt) => ({
    kind: "receipt" as const,
    id: receipt.id,
    binCode: receipt.bin_code,
    sku: receipt.sku,
    merchantPrincipalId: receipt.merchant_principal_id,
    delta: receipt.quantity,
    note: receipt.note,
    actorPrincipalId: receipt.received_by_principal_id,
    createdAt: receipt.created_at
  }))
)

const adjustmentSchema = v.pipe(
  v.object({
    id: idSchema,
    bin_code: v.string(),
    sku: v.string(),
    merchant_principal_id: v.nullable(v.string()),
    quantity_delta: v.pipe(v.number(), v.integer()),
    quantity_before: countSchema,
    quantity_after: countSchema,
    reason: reasonSchema,
    note: v.nullable(v.string()),
    adjusted_by_principal_id: v.string(),
    created_at: instantSchema
  }),
  v.transform((adjustment) => ({
    kind: "adjustment" as const,
    id: adjustment.id,
    binCode: adjustment.bin_code,
    sku: adjustment.sku,
    merchantPrincipalId: adjustment.merchant_principal_id,
    delta: adjustment.quantity_delta,
    before: adjustment.quantity_before,
    after: adjustment.quantity_after,
    reason: adjustment.reason,
    note: adjustment.note,
    actorPrincipalId: adjustment.adjusted_by_principal_id,
    createdAt: adjustment.created_at
  }))
)

const receiptPageSchema = v.pipe(
  v.object({ receipts: v.array(receiptSchema), next_before_id: v.nullable(idSchema) }),
  v.transform((page): LedgerPage => ({ entries: page.receipts, nextBeforeId: page.next_before_id }))
)

const adjustmentPageSchema = v.pipe(
  v.object({ adjustments: v.array(adjustmentSchema), next_before_id: v.nullable(idSchema) }),
  v.transform((page): LedgerPage => ({ entries: page.adjustments, nextBeforeId: page.next_before_id }))
)

const savedBinSchema = v.pipe(
  v.object({ id: idSchema, bin_code: v.string(), zone: v.string(), shelf_level: countSchema }),
  v.transform((bin): SavedBin => ({ id: bin.id, code: bin.bin_code, zone: bin.zone, shelfLevel: bin.shelf_level }))
)

const movementSchema = v.pipe(
  v.object({
    id: idSchema,
    sku: v.string(),
    bin_code: v.string(),
    quantity_on_hand: countSchema,
    replayed: v.boolean()
  }),
  v.transform(
    (movement): StockMovement => ({
      id: movement.id,
      sku: movement.sku,
      binCode: movement.bin_code,
      onHand: movement.quantity_on_hand,
      replayed: movement.replayed
    })
  )
)

const productSchema = v.pipe(
  v.object({ sku: v.string(), title: v.string(), merchant_principal_id: v.nullable(v.string()) }),
  v.transform(
    (product): CatalogProduct => ({
      sku: product.sku,
      title: product.title,
      merchantPrincipalId: product.merchant_principal_id
    })
  )
)

export {
  adjustmentPageSchema,
  binPageSchema,
  movementSchema,
  productSchema,
  receiptPageSchema,
  savedBinSchema,
  stockPageSchema
}
