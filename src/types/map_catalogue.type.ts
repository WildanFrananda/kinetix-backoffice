import type map from "../catalogue/map/en.json"
import type { Catalogue } from "./catalogue.type"

type MapCatalogue = Catalogue & typeof map

export type { MapCatalogue }
