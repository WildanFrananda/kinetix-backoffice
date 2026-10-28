type GovernorMessage = { type: "spent"; at: number } | { type: "held"; until: number }

export type { GovernorMessage }
