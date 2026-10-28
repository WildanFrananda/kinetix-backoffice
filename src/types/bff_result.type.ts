import type { BffFailure } from "./bff_failure.type"

type BffResult<Value> =
  | {
      ok: true
      value: Value
    }
  | {
      ok: false
      failure: BffFailure
    }

export type { BffResult }
