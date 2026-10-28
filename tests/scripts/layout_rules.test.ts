import { describe, expect, it } from "vitest"
import { fixLayout, layoutProblems } from "../../scripts/layout_rules"

function rules(source: string): string[] {
  return layoutProblems(source, "sample.ts").map((problem) => `${problem.line} ${problem.rule}`)
}

describe("the layout rules", () => {
  it("asks for a blank line after a block before the next statement", () => {
    const source = ["function f(a: boolean) {", "  if (a) {", "    g()", "  }", "  h()", "}", ""].join("\n")

    expect(rules(source)).toEqual(["5 after-block"])
    expect(fixLayout(source, layoutProblems(source, "sample.ts"))).toBe(
      ["function f(a: boolean) {", "  if (a) {", "    g()", "  }", "", "  h()", "}", ""].join("\n")
    )
  })

  it("lets a check sit under the assignment it reads, and nothing else", () => {
    const reads = ["function f() {", "  const result = g()", "  if (!result.ok) {", "    h()", "  }", "}", ""]
    const ignores = ["function f(a: number) {", "  g()", "  if (a > 1) {", "    h()", "  }", "}", ""]

    expect(rules(reads.join("\n"))).toEqual([])
    expect(rules(ignores.join("\n"))).toEqual(["3 cuddled-check"])
  })

  it("lets a long assignment stay above the check that reads it", () => {
    const source = [
      "function f() {",
      "  const result = g(",
      "    1,",
      "    2",
      "  )",
      "  if (result) {",
      "    h()",
      "  }",
      "}",
      ""
    ]

    expect(rules(source.join("\n"))).toEqual([])
  })

  it("asks for a blank line before a return that ends a block of more than two lines", () => {
    const short = ["function f() {", "  g()", "  return 1", "}", ""]
    const long = ["function f() {", "  g()", "  h()", "  return 1", "}", ""]

    expect(rules(short.join("\n"))).toEqual([])
    expect(rules(long.join("\n"))).toEqual(["4 cuddled-return"])
  })

  it("refuses a blank line just inside a block's braces", () => {
    const source = ["function f() {", "", "  g()", "", "}", ""].join("\n")

    expect(rules(source)).toEqual(["2 blank-after-open", "4 blank-before-close"])
    expect(fixLayout(source, layoutProblems(source, "sample.ts"))).toBe(["function f() {", "  g()", "}", ""].join("\n"))
  })

  it("leaves a run of imports alone, however long each one is", () => {
    const source = ["import {", "  a,", "  b", '} from "x"', 'import { c } from "y"', ""].join("\n")

    expect(rules(source)).toEqual([])
  })
})
