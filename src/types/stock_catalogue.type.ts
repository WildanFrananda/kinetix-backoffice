import type stock from "../catalogue/stock/en.json"
import type { Catalogue } from "./catalogue.type"

type StockCatalogue = Catalogue & typeof stock

export type { StockCatalogue }
