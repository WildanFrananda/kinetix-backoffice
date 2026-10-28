import axe from "axe-core"

async function axeViolations(container: Element): Promise<string[]> {
  const results = await axe.run(container, {
    rules: {
      "color-contrast": { enabled: false },
      region: { enabled: false }
    }
  })

  return results.violations.map((violation) => {
    const targets = violation.nodes.map((node) => node.target.join(" ")).join(", ")

    return `${violation.id}: ${targets}`
  })
}

export { axeViolations }
