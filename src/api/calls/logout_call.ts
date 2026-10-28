import * as v from "valibot"
import type { BffCall } from "../../types/bff_call.type"

const logoutCall: BffCall<undefined> = {
  endpoint: "edge.logout",
  method: "POST",
  path: "/bff/logout",
  schema: v.undefined()
}

export { logoutCall }
