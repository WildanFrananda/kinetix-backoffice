import type { GenericSchema } from "valibot"

type BffCall<Value> = {
  endpoint: string
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  path: `/bff/${string}`
  body?: unknown
  schema: GenericSchema<unknown, Value>
}

export type { BffCall }
