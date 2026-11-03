import type { Predicate } from "./predicate.type"
import type { PredicateRegistry } from "./predicate_registry.type"

type PredicateListing = {
  registry: PredicateRegistry | null
  predicates: Predicate[]
}

export type { PredicateListing }
