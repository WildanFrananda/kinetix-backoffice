type ScriptUrlPolicyFactory = {
  createPolicy: (name: string, rules: { createScriptURL: (input: string) => string }) => unknown
}

export type { ScriptUrlPolicyFactory }
