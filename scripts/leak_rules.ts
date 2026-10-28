import type { LeakRule } from "./types/leak_rule.type.ts"

function never(): boolean {
  return false
}

function isPublishableAddress(address: string): boolean {
  const octets = address.split(".").map(Number)
  const [first, second, third] = octets
  if (octets.some((octet) => octet > 255)) {
    return true
  }
  return (
    first === 127 ||
    address === "0.0.0.0" ||
    (first === 192 && second === 0 && third === 2) ||
    (first === 198 && second === 51 && third === 100) ||
    (first === 203 && second === 0 && third === 113)
  )
}

function escapeExpression(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function leakRules(denylist: string): LeakRule[] {
  const builtin: LeakRule[] = [
    { name: "private-key", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g, permits: never },
    { name: "age-secret-key", pattern: /AGE-SECRET-KEY-1[0-9A-Z]+/g, permits: never },
    { name: "jwt", pattern: /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+/g, permits: never },
    { name: "aws-access-key", pattern: /\bAKIA[0-9A-Z]{16}\b/g, permits: never },
    { name: "ipv4-address", pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, permits: isPublishableAddress }
  ]
  const listed = denylist
    .split("\n")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map(function listedRule(entry, index): LeakRule {
      return { name: `denylist entry ${index + 1}`, pattern: new RegExp(escapeExpression(entry), "gi"), permits: never }
    })
  return [...builtin, ...listed]
}

export { leakRules }
