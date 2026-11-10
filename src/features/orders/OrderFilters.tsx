import { type FormEvent, useState } from "react"
import { ToggleButton, ToggleButtonGroup } from "react-aria-components"
import { orderStatuses } from "../../api/schemas/order_statuses"
import { formatText } from "../../i18n/format_text"
import type { OrderFiltersDraft } from "../../types/order_filters_draft.type"
import type { OrdersSearch } from "../../types/orders_search.type"
import { Button } from "../../ui/Button"
import { MagnifyingGlass } from "../../ui/icons/MagnifyingGlass"
import { X } from "../../ui/icons/X"
import { TextField } from "../../ui/TextField"
import styles from "./Orders.module.css"
import { filtered, statusesOf } from "./order_query_of"
import { useOrdersText } from "./orders_text"

const principalLength = 64

const orderNumberLength = 64

const principalPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function draftOf(search: OrdersSearch): OrderFiltersDraft {
  return {
    statuses: statusesOf(search.status),
    from: search.from ?? "",
    to: search.to ?? "",
    merchant: search.merchant ?? "",
    customer: search.customer ?? "",
    orderNumber: search.orderNumber ?? ""
  }
}

function given(value: string): string | undefined {
  const trimmed = value.trim()

  return trimmed.length === 0 ? undefined : trimmed
}

function searchOf(draft: OrderFiltersDraft): OrdersSearch {
  const statuses = orderStatuses.filter((status) => draft.statuses.includes(status))

  return {
    status: statuses.length === 0 ? undefined : statuses.join(","),
    from: given(draft.from),
    to: given(draft.to),
    merchant: given(draft.merchant)?.toLowerCase(),
    customer: given(draft.customer)?.toLowerCase(),
    orderNumber: given(draft.orderNumber)?.toUpperCase()
  }
}

function principalProblem(value: string): boolean {
  const trimmed = value.trim()

  return trimmed.length > 0 && !principalPattern.test(trimmed)
}

function timeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

function OrderFilters({ search, onApply }: { search: OrdersSearch; onApply: (next: OrdersSearch) => void }) {
  const text = useOrdersText()
  const [draft, setDraft] = useState<OrderFiltersDraft>(() => draftOf(search))
  const [checked, setChecked] = useState(false)
  const rangeInverted = checked && draft.from !== "" && draft.to !== "" && draft.from > draft.to
  const merchantInvalid = checked && principalProblem(draft.merchant)
  const customerInvalid = checked && principalProblem(draft.customer)

  function change(next: Partial<OrderFiltersDraft>): void {
    setChecked(false)
    setDraft((current) => ({ ...current, ...next }))
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()

    const inverted = draft.from !== "" && draft.to !== "" && draft.from > draft.to
    if (inverted || principalProblem(draft.merchant) || principalProblem(draft.customer)) {
      setChecked(true)
      return
    }

    onApply(searchOf(draft))
  }

  return (
    <form className={styles.search} aria-labelledby="order-search-title" onSubmit={submit}>
      <h2 id="order-search-title" className={styles.searchTitle}>
        {text["orders.filters.title"]}
      </h2>
      <div className={styles.statusGroup}>
        <span id="order-status-label" className={styles.choiceLabel}>
          {text["orders.filters.status"]}
        </span>
        <ToggleButtonGroup
          aria-labelledby="order-status-label"
          aria-describedby="order-status-note"
          selectionMode="multiple"
          selectedKeys={draft.statuses}
          onSelectionChange={(keys) => {
            const chosen = new Set(keys)
            change({ statuses: orderStatuses.filter((status) => chosen.has(status)) })
          }}
          className={styles.statuses}
        >
          {orderStatuses.map((status) => (
            <ToggleButton key={status} id={status} className={styles.status}>
              {text[`orders.status.${status}`]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <p id="order-status-note" className={styles.note}>
          {text["orders.filters.statusNote"]}
        </p>
      </div>
      <div className={styles.fields}>
        <div className={styles.third}>
          <TextField
            label={text["orders.filters.orderNumber"]}
            description={text["orders.filters.orderNumberNote"]}
            id="order-number-filter"
            mono
            maxLength={orderNumberLength}
            value={draft.orderNumber}
            onChange={(value) => change({ orderNumber: value })}
          />
        </div>
        <div className={styles.third}>
          <TextField
            label={text["orders.filters.from"]}
            type="date"
            value={draft.from}
            error={rangeInverted ? text["orders.filters.rangeInverted"] : null}
            onChange={(value) => change({ from: value })}
          />
        </div>
        <div className={styles.third}>
          <TextField
            label={text["orders.filters.to"]}
            description={formatText(text["orders.filters.rangeNote"], { zone: timeZone() })}
            type="date"
            value={draft.to}
            onChange={(value) => change({ to: value })}
          />
        </div>
        <div className={styles.half}>
          <TextField
            label={text["orders.filters.merchant"]}
            mono
            maxLength={principalLength}
            error={merchantInvalid ? text["orders.filters.principalInvalid"] : null}
            value={draft.merchant}
            onChange={(value) => change({ merchant: value })}
          />
        </div>
        <div className={styles.half}>
          <TextField
            label={text["orders.filters.customer"]}
            mono
            maxLength={principalLength}
            error={customerInvalid ? text["orders.filters.principalInvalid"] : null}
            value={draft.customer}
            onChange={(value) => change({ customer: value })}
          />
        </div>
      </div>
      <div className={styles.searchActions}>
        <Button type="submit">
          <MagnifyingGlass aria-hidden="true" />
          {text["orders.filters.search"]}
        </Button>
        {filtered(search) ? (
          <Button variant="quiet" onPress={() => onApply({})}>
            <X aria-hidden="true" />
            {text["orders.filters.clear"]}
          </Button>
        ) : null}
      </div>
    </form>
  )
}

function filterKey(search: OrdersSearch): string {
  return [search.status, search.from, search.to, search.merchant, search.customer, search.orderNumber].join("|")
}

export { filterKey, OrderFilters }
