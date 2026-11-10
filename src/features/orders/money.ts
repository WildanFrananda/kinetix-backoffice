import type { Locale } from "../../types/locale.type"

function rupiah(locale: Locale): Intl.NumberFormat {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}

export { rupiah }
