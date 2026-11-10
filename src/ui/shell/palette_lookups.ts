import { formatText } from "../../i18n/format_text"
import type { Catalogue } from "../../types/catalogue.type"
import type { PaletteGroup } from "../../types/palette_group.type"
import { ArrowUUpLeft } from "../icons/ArrowUUpLeft"
import { Receipt } from "../icons/Receipt"

const orderNumber = /^ORD-\d{8}-[0-9A-F]{8}$/

const returnNumber = /^RMA-\d{8}-[0-9A-F]{8}$/

function paletteLookups(
  text: Catalogue,
  typed: string,
  actions: {
    findOrder: (number: string) => void
    findReturn: (number: string) => void
  }
): PaletteGroup | null {
  const wanted = typed.trim().toUpperCase()

  if (orderNumber.test(wanted)) {
    return {
      id: "lookup",
      title: text["palette.lookup"],
      commands: [
        {
          id: `order:${wanted}`,
          label: formatText(text["palette.findOrder"], { number: wanted }),
          keywords: typed,
          icon: Receipt,
          hint: null,
          run: () => actions.findOrder(wanted)
        }
      ]
    }
  }

  if (returnNumber.test(wanted)) {
    return {
      id: "lookup",
      title: text["palette.lookup"],
      commands: [
        {
          id: `return:${wanted}`,
          label: formatText(text["palette.findReturn"], { number: wanted }),
          keywords: typed,
          icon: ArrowUUpLeft,
          hint: null,
          run: () => actions.findReturn(wanted)
        }
      ]
    }
  }

  return null
}

export { paletteLookups }
