type JobRequest = {
  name: "assign" | "unassign" | "cancel"
  serial: number
}

export type { JobRequest }
