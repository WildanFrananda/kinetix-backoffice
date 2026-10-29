import { queryOptions } from "@tanstack/react-query"
import { bffFetch } from "../../api/bff_fetch"
import { passkeysCall } from "../../api/calls/passkeys_call"

const passkeysKey = ["bff", "passkeys"] as const

function passkeysQuery(userId: number) {
  return queryOptions({
    queryKey: [...passkeysKey, userId],
    queryFn: ({ signal }) => bffFetch(passkeysCall(userId), signal)
  })
}

export { passkeysKey, passkeysQuery }
