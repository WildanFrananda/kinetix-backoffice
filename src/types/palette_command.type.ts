import type { Icon } from "@phosphor-icons/react"

type PaletteCommand = {
  id: string
  label: string
  keywords: string
  icon: Icon
  hint: string | null
  run: () => void
}

export type { PaletteCommand }
