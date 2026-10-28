import { createRequestGovernor } from "./request_governor"

const requestsPerMinute = 80

const governor = createRequestGovernor({
  limit: requestsPerMinute,
  windowMs: 60_000,
  now: Date.now,
  channelName: "kx-backoffice-requests"
})

export { governor, requestsPerMinute }
