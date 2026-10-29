import type { Category } from "../../types/category.type"

function sortedCategories(categories: readonly Category[], locale: string): Category[] {
  const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true })

  return [...categories].sort((a, b) => collator.compare(a.name, b.name) || a.id - b.id)
}

function matchingCategories(categories: readonly Category[], query: string, locale: string): Category[] {
  const wanted = query.trim().toLocaleLowerCase(locale)
  if (wanted.length === 0) {
    return [...categories]
  }

  return categories.filter(
    (category) =>
      category.name.toLocaleLowerCase(locale).includes(wanted) ||
      category.slug.toLowerCase().includes(wanted) ||
      String(category.id) === wanted
  )
}

function withCategory(categories: readonly Category[], saved: Category): Category[] {
  return categories.some((category) => category.id === saved.id)
    ? categories.map((category) => (category.id === saved.id ? saved : category))
    : [...categories, saved]
}

function withoutCategory(categories: readonly Category[], id: number): Category[] {
  return categories.filter((category) => category.id !== id)
}

export { matchingCategories, sortedCategories, withCategory, withoutCategory }
