import type { Vector3Tuple } from "../types/vector3_tuple.type"

function floorGrid(half: number): Array<[Vector3Tuple, Vector3Tuple]> {
  const lines: Array<[Vector3Tuple, Vector3Tuple]> = []

  for (let step = -half; step <= half + 0.001; step += 0.5) {
    lines.push([
      [step, 0, -half],
      [step, 0, half]
    ])

    lines.push([
      [-half, 0, step],
      [half, 0, step]
    ])
  }

  return lines
}

export { floorGrid }
