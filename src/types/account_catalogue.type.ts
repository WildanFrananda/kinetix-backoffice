import type account from "../catalogue/account/en.json"
import type { Catalogue } from "./catalogue.type"

type AccountCatalogue = Catalogue & typeof account

export type { AccountCatalogue }
