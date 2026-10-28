import type { PaletteCommand } from "./palette_command.type"

type PaletteGroup = {
  id: string
  title: string
  commands: readonly PaletteCommand[]
}

export type { PaletteGroup }
