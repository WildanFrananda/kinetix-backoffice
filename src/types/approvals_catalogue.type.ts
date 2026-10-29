import type approvals from "../catalogue/approvals/en.json"
import type { Catalogue } from "./catalogue.type"

type ApprovalsCatalogue = Catalogue & typeof approvals

export type { ApprovalsCatalogue }
