import type { DecisionPeriod } from "../../types/decision_period.type"

function periodStarts(now: Date): Readonly<Record<DecisionPeriod, Date>> {
  const year = now.getFullYear()
  const month = now.getMonth()
  const date = now.getDate()
  const sinceMonday = (now.getDay() + 6) % 7

  return {
    day: new Date(year, month, date),
    week: new Date(year, month, date - sinceMonday),
    month: new Date(year, month, 1)
  }
}

export { periodStarts }
