import type { JobAction } from "./job_action.type"

type JobReport =
  | { tone: "working" | "done"; text: string }
  | { tone: "problem"; text: string; quote: string | null; retry: JobAction | null; readAgain: boolean }

export type { JobReport }
