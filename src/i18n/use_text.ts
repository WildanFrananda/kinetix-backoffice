import type { Catalogue } from "../types/catalogue.type"
import { catalogues } from "./catalogues"
import { useLocale } from "./use_locale"

function useText(): Catalogue {
  return catalogues[useLocale()]
}

export { useText }
