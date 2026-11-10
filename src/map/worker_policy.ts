import type { ScriptUrlPolicyFactory } from "../types/script_url_policy_factory.type"

let admitted: string | null = null

function policyFactory(scope: object): ScriptUrlPolicyFactory | null {
  const factory: unknown = Reflect.get(scope, "trustedTypes")
  if (typeof factory !== "object" || factory === null) {
    return null
  }

  const createPolicy: unknown = Reflect.get(factory, "createPolicy")
  if (typeof createPolicy !== "function") {
    return null
  }

  return {
    createPolicy: (name, rules) => Reflect.apply(createPolicy, factory, [name, rules])
  }
}

function admitWorker(url: string): void {
  if (admitted !== null) {
    if (admitted !== url) {
      throw new TypeError("The Trusted Types policy already admits another worker")
    }

    return
  }

  policyFactory(window)?.createPolicy("default", {
    createScriptURL(input: string): string {
      if (input === url) {
        return input
      }

      throw new TypeError(`Trusted Types refused a script URL that is not the map's worker: ${input}`)
    }
  })

  admitted = url
}

export { admitWorker, policyFactory }
