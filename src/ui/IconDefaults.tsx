import { IconContext } from "@phosphor-icons/react"
import type { ReactNode } from "react"

const iconDefaults = { size: 18, weight: "regular", mirrored: false } as const

function IconDefaults({ children }: { children: ReactNode }) {
  return <IconContext.Provider value={iconDefaults}>{children}</IconContext.Provider>
}

export { IconDefaults }
