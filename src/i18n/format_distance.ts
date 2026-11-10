function formatDistance(kilometres: number, locale: string): string {
  if (kilometres < 1) {
    return new Intl.NumberFormat(locale, { style: "unit", unit: "meter", maximumFractionDigits: 0 }).format(
      kilometres * 1000
    )
  }

  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: "kilometer",
    maximumFractionDigits: kilometres < 10 ? 2 : 1
  }).format(kilometres)
}

export { formatDistance }
