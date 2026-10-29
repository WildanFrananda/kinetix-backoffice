import type { IconWeight } from "@phosphor-icons/react"
import { Fragment, isValidElement, type ReactElement, type ReactNode } from "react"

function attributeOf(name: string, value: unknown): string {
  if (typeof value === "string") {
    return `${name}=${JSON.stringify(value)}`
  }

  return `${name}={${JSON.stringify(value)}}`
}

function jsxOf(node: ReactNode): string {
  if (Array.isArray(node)) {
    return node.map(jsxOf).join("")
  }

  if (node === null || node === undefined || typeof node === "boolean") {
    return ""
  }

  if (!isValidElement(node)) {
    throw new Error(`an icon holds something that is not an element: ${String(node)}`)
  }

  const { children, ...props } = node.props as { children?: ReactNode } & Record<string, unknown>
  const inner = jsxOf(children)

  if (node.type === Fragment) {
    return isValidElement(children) ? inner : `<>${inner}</>`
  }

  if (typeof node.type !== "string") {
    throw new Error("an icon holds a component, not an SVG element")
  }

  const attributes = Object.entries(props).map(([name, value]) => ` ${attributeOf(name, value)}`)
  const opening = `<${node.type}${attributes.join("")}`

  return inner.length === 0 ? `${opening} />` : `${opening}>${inner}</${node.type}>`
}

function iconSource(name: string, weights: readonly (readonly [IconWeight, ReactElement])[]): string {
  const entries = weights.map(([weight, element]) => `  [${JSON.stringify(weight)}, ${jsxOf(element)}]`)

  return [
    'import { type Icon, IconBase, type IconWeight } from "@phosphor-icons/react"',
    'import { forwardRef, type ReactElement } from "react"',
    "",
    "const weights = new Map<IconWeight, ReactElement>([",
    entries.join(",\n"),
    "])",
    "",
    `const ${name}: Icon = forwardRef(function ${name}(props, ref) {`,
    "  return <IconBase ref={ref} {...props} weights={weights} />",
    "})",
    "",
    `export { ${name} }`,
    ""
  ].join("\n")
}

export { iconSource }
