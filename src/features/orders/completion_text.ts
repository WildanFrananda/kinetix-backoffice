import { formatText } from "../../i18n/format_text"
import type { OrderReport } from "../../types/order_report.type"
import type { OrdersCatalogue } from "../../types/orders_catalogue.type"

const releaseRetried =
  "payment could not be asked to release the escrow; the release is retried until payment accepts it"

const releaseAwaitsStaff = "payment refused to release the escrow; the release is not retried and waits for staff"

function completionText(report: OrderReport, text: OrdersCatalogue): string {
  const values = { number: report.orderNumber }

  if (report.escrowReleased) {
    return formatText(text["orders.complete.released"], values)
  }

  if (report.detail === releaseRetried) {
    return formatText(text["orders.complete.retried"], values)
  }

  if (report.detail === releaseAwaitsStaff) {
    return formatText(text["orders.complete.awaitsStaff"], values)
  }

  return formatText(text["orders.complete.notReleased"], { ...values, detail: report.detail ?? "" })
}

export { completionText }
