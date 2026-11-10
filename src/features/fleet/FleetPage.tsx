import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button as IconButton, Input, SearchField, ToggleButton, ToggleButtonGroup } from "react-aria-components"
import { BffError } from "../../api/bff_error"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { CourierViewState } from "../../types/courier_view_state.type"
import type { DispatchJob } from "../../types/dispatch_job.type"
import type { FleetSearch } from "../../types/fleet_search.type"
import { ArrowClockwise } from "../../ui/icons/ArrowClockwise"
import { MagnifyingGlass } from "../../ui/icons/MagnifyingGlass"
import { MapTrifold } from "../../ui/icons/MapTrifold"
import { KeyHints } from "../../ui/KeyHints"
import { StreetMap } from "../../ui/map/StreetMap"
import { PageHeader } from "../../ui/PageHeader"
import { PanelProblem } from "../../ui/PanelProblem"
import { usePageKeys } from "../../ui/use_page_keys"
import { usePresence } from "../../ui/use_presence"
import { CourierList } from "./CourierList"
import { CourierView } from "./CourierView"
import { matchingCouriers, sortedCouriers } from "./courier_order"
import styles from "./Fleet.module.css"
import { courierJobsQuery, courierQuery, couriersQuery } from "./fleet_queries"
import { useFleetText } from "./fleet_text"
import { courierStatuses } from "./job_status"
import { chosenId, fleetFrame, fleetScene } from "./map_scenes"

const noJobs: readonly DispatchJob[] = []

function FleetPage({ search, onSearch }: { search: FleetSearch; onSearch: (next: FleetSearch) => void }) {
  const text = useFleetText()
  const locale = useLocale()
  const numbers = new Intl.NumberFormat(locale)
  const navigate = useNavigate()
  const poll = usePresence()
  const list = useQuery(couriersQuery(poll))
  const [query, setQuery] = useState("")
  const detailColumn = useRef<HTMLDivElement>(null)
  const couriers = useMemo(() => sortedCouriers(list.data ?? []), [list.data])
  const shown = useMemo(() => matchingCouriers(couriers, search.status, query), [couriers, search.status, query])
  const selectedId = search.courier ?? null
  const listed = couriers.find((courier) => courier.id === selectedId) ?? null
  const single = useQuery(
    courierQuery(selectedId !== null && list.data !== undefined && listed === null ? selectedId : null)
  )

  const jobs = useQuery(courierJobsQuery(selectedId))
  const labels = useMemo(() => ({ pickup: text["fleet.map.pickup"], dropoff: text["fleet.map.dropoff"] }), [text])
  const heldJobs = jobs.data ?? noJobs
  const selected = listed ?? single.data ?? null
  const scene = useMemo(
    () => fleetScene(shown, selectedId, selectedId === null ? noJobs : heldJobs, labels),
    [shown, selectedId, heldJobs, labels]
  )

  const frame = fleetFrame(shown, selected, selectedId === null ? noJobs : heldJobs)
  const frameKey =
    selectedId === null ? `all|${list.data === undefined ? "" : "read"}` : `${selectedId}|${jobs.isSuccess}`

  function choose(id: number): void {
    onSearch({ ...search, courier: id })
  }

  function step(by: number): void {
    if (shown.length === 0) {
      return
    }

    const at = shown.findIndex((courier) => courier.id === selectedId)
    const next = shown[at === -1 ? (by > 0 ? 0 : shown.length - 1) : (at + by + shown.length) % shown.length]
    if (next !== undefined) {
      choose(next.id)
    }
  }

  usePageKeys(
    {
      j: () => step(1),
      k: () => step(-1),
      "/": () => document.getElementById("courier-filter")?.focus()
    },
    true
  )

  useEffect(() => {
    if (selectedId === null || window.matchMedia("(min-width: 64rem)").matches) {
      return
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    detailColumn.current?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" })
  }, [selectedId])

  function chooseOnMap(placeId: string): void {
    const chosen = chosenId(placeId)
    if (chosen === null) {
      return
    }

    if (chosen.kind === "courier") {
      choose(chosen.id)

      return
    }

    void navigate({ to: "/dispatch", search: { job: chosen.id } })
  }

  function courierState(): CourierViewState {
    if (listed !== null) {
      return { kind: "known", courier: listed }
    }

    if (list.data === undefined || single.isPending) {
      return { kind: "loading" }
    }

    if (single.isError) {
      return {
        kind: "failed",
        failure: single.error instanceof BffError ? single.error.failure : null,
        retry: () => void single.refetch()
      }
    }

    return { kind: "known", courier: single.data ?? null }
  }

  function listBody() {
    if (list.isPending) {
      return (
        <p className={styles.listState} aria-busy="true">
          {text["fleet.list.loading"]}
        </p>
      )
    }

    if (list.isError && list.data === undefined) {
      return (
        <PanelProblem
          failure={list.error instanceof BffError ? list.error.failure : null}
          onRetry={() => void list.refetch()}
        />
      )
    }

    if (couriers.length === 0) {
      return <p className={styles.listState}>{text["fleet.list.empty"]}</p>
    }

    if (shown.length === 0) {
      return <p className={styles.listState}>{text["fleet.list.noneMatch"]}</p>
    }

    return <CourierList couriers={shown} selected={selectedId} onSelect={choose} />
  }

  return (
    <>
      <PageHeader
        eyebrow={text["fleet.eyebrow"]}
        title={text["fleet.title"]}
        lead={poll ? text["fleet.lead"] : text["fleet.paused"]}
      />
      <div className={styles.desk}>
        <StreetMap
          label={text["fleet.map.label"]}
          scene={scene}
          frame={frame}
          frameKey={frameKey}
          onChoose={chooseOnMap}
        />
        <KeyHints
          label={text["fleet.keys.label"]}
          hints={[
            { keys: ["J", "K"], label: text["fleet.keys.move"] },
            { keys: ["/"], label: text["fleet.keys.filter"] }
          ]}
        />
      </div>
      <div className={styles.workspace}>
        <section className={styles.listColumn} aria-labelledby="couriers-title" aria-busy={list.isFetching}>
          <div className={styles.listHead}>
            <h2 id="couriers-title" className={styles.listTitle}>
              {text["fleet.list.title"]}
              {list.data === undefined ? null : (
                <span className={styles.count}>
                  {formatText(text["fleet.list.count"], { count: numbers.format(couriers.length) })}
                </span>
              )}
            </h2>
            <IconButton
              className={styles.refresh}
              aria-label={text["fleet.refresh"]}
              isDisabled={list.isFetching}
              onPress={() => void list.refetch()}
            >
              <ArrowClockwise aria-hidden="true" />
            </IconButton>
          </div>
          <div className={styles.filters}>
            <span className={styles.choiceLabel} id="courier-status-label">
              {text["fleet.courierStatus.label"]}
            </span>
            <ToggleButtonGroup
              aria-labelledby="courier-status-label"
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[search.status ?? "all"]}
              onSelectionChange={(keys) => {
                const [picked] = [...keys]
                const next = courierStatuses.find((candidate) => candidate === picked)
                onSearch({ status: next, courier: search.courier })
              }}
              className={styles.statuses}
            >
              {(["all", ...courierStatuses] as const).map((candidate) => (
                <ToggleButton key={candidate} id={candidate} className={styles.status}>
                  {text[`fleet.courierStatus.${candidate}`]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <SearchField
              aria-label={text["fleet.filter.label"]}
              value={query}
              onChange={setQuery}
              className={styles.filter}
            >
              <MagnifyingGlass aria-hidden="true" className={styles.filterIcon} />
              <Input
                id="courier-filter"
                className={styles.filterInput}
                inputMode="numeric"
                placeholder={text["fleet.filter.description"]}
              />
            </SearchField>
          </div>
          {listBody()}
        </section>
        <div ref={detailColumn} className={styles.detailColumn}>
          {selectedId === null ? (
            <div className={styles.idle}>
              <MapTrifold aria-hidden="true" size={28} />
              <p className={styles.idleTitle}>{text["fleet.idle.title"]}</p>
              <p className={styles.idleBody}>{text["fleet.idle.body"]}</p>
            </div>
          ) : (
            <CourierView courierId={selectedId} state={courierState()} jobs={jobs} />
          )}
        </div>
      </div>
    </>
  )
}

export { FleetPage }
