import type { DrawingPart } from "../types/drawing_part.type"

const shelfLevels = [0.06, 1.0, 1.94]

const corners: ReadonlyArray<[number, number]> = [
  [-1.46, -0.56],
  [1.46, -0.56],
  [-1.46, 0.56],
  [1.46, 0.56]
]

const posts: DrawingPart[] = corners.map(([x, z]) => ({
  size: [0.08, 2.6, 0.08],
  home: [x, 1.3, z],
  offset: [x * 0.35, 0, z * 0.9],
  accent: false
}))

const shelves: DrawingPart[] = shelfLevels.map((level, index) => ({
  size: [3, 0.06, 1.2],
  home: [0, level, 0],
  offset: [0, -0.4 + index * 0.35, 0],
  accent: false
}))

const parcels: DrawingPart[] = [
  { size: [0.9, 0.62, 0.78], home: [-0.82, 0.4, 0.04], offset: [-1.1, 0.9, 0.6], accent: false },
  { size: [0.68, 0.46, 0.6], home: [0.56, 0.32, -0.12], offset: [1.2, 1.1, -0.4], accent: false },
  { size: [1.04, 0.72, 0.9], home: [0.1, 1.39, 0], offset: [0.2, 1.6, 1.4], accent: true },
  { size: [0.52, 0.4, 0.5], home: [-0.94, 2.17, 0.1], offset: [-0.9, 1.4, -0.6], accent: false },
  { size: [0.6, 0.36, 0.56], home: [0.84, 2.15, -0.06], offset: [1.0, 1.7, 0.5], accent: false }
]

const drawingParts: readonly DrawingPart[] = [...posts, ...shelves, ...parcels]

export { drawingParts }
