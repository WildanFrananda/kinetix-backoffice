import { describe, expect, it, vi } from "vitest"

describe("the map's Trusted Types policy", () => {
  it("is named default and admits the map's worker URL only", async () => {
    vi.resetModules()

    const rules: Array<{ name: string; createScriptURL: (input: string) => string }> = []
    vi.stubGlobal("trustedTypes", {
      createPolicy(name: string, policy: { createScriptURL: (input: string) => string }) {
        rules.push({ name, createScriptURL: policy.createScriptURL })

        return {}
      }
    })

    const { admitWorker } = await import("../../src/map/worker_policy")
    const worker = "https://backoffice.test/assets/maplibre-gl-worker-AbC123.js"

    admitWorker(worker)
    admitWorker(worker)

    expect(rules.map((rule) => rule.name)).toEqual(["default"])
    expect(rules[0]?.createScriptURL(worker)).toBe(worker)
    expect(() => rules[0]?.createScriptURL("https://backoffice.test/assets/other.js")).toThrow(TypeError)
    expect(() => rules[0]?.createScriptURL("blob:https://backoffice.test/1")).toThrow(TypeError)
    expect(() => admitWorker("https://backoffice.test/assets/another-worker.js")).toThrow(TypeError)

    vi.unstubAllGlobals()
  })

  it("does nothing where the browser has no Trusted Types", async () => {
    vi.resetModules()

    const { admitWorker, policyFactory } = await import("../../src/map/worker_policy")

    expect(policyFactory({})).toBeNull()
    expect(() => admitWorker("https://backoffice.test/assets/maplibre-gl-worker-AbC123.js")).not.toThrow()
  })
})
