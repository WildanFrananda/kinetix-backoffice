import type { BffCall } from "../../types/bff_call.type"
import type { Session } from "../../types/session.type"
import { sessionSchema } from "../schemas/session_schema"

const sessionCall: BffCall<Session> = {
  endpoint: "edge.session",
  method: "GET",
  path: "/bff/session",
  schema: sessionSchema
}

export { sessionCall }
