import { useQuery } from "@tanstack/react-query"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button as IconButton, Input, SearchField, ToggleButton, ToggleButtonGroup } from "react-aria-components"
import { BffError } from "../../api/bff_error"
import { formatText } from "../../i18n/format_text"
import type { DispatchJob } from "../../types/dispatch_job.type"
import type { DispatchSearch } from "../../types/dispatch_search.type"
import type { JobRequest } from "../../types/job_request.type"
import { Button } from "../../ui/Button"
import { Figure } from "../../ui/Figure"
import { ArrowClockwise } from "../../ui/icons/ArrowClockwise"
import { ArrowLeft } from "../../ui/icons/ArrowLeft"
import { ArrowRight } from "../../ui/icons/ArrowRight"
import { MagnifyingGlass } from "../../ui/icons/MagnifyingGlass"
import { Path } from "../../ui/icons/Path"
import { KeyHints } from "../../ui/KeyHints"
import { PageHeader } from "../../ui/PageHeader"
import { PanelProblem } from "../../ui/PanelProblem"
import { usePageKeys } from "../../ui/use_page_keys"
import { usePresence } from "../../ui/use_presence"
import { dispatchSummaryQuery } from "../overview/overview_queries"
import styles from "./Fleet.module.css"
import { jobsQuery } from "./fleet_queries"
import { useFleetText } from "./fleet_text"
import { JobList } from "./JobList"
import { JobView } from "./JobView"
import { jobStatuses } from "./job_status"

function matches(job: DispatchJob, query: string): boolean {
  const wanted = query.trim().toLowerCase()
  if (wanted.length === 0) {
    return true
  }

  return [String(job.id), job.orderNumber ?? "", job.awbNumber ?? ""].some((value) =>
    value.toLowerCase().includes(wanted)
  )
}

function DispatchPage({ search, onSearch }: { search: DispatchSearch; onSearch: (next: DispatchSearch) => void }) {
  const text = useFleetText()
  const poll = usePresence()
  const summary = useQuery(dispatchSummaryQuery(poll))
  const list = useQuery(jobsQuery({ status: search.status, before: search.before }, poll))
  const [query, setQuery] = useState("")
  const [request, setRequest] = useState<JobRequest | null>(null)
  const detailColumn = useRef<HTMLDivElement>(null)
  const jobs = list.data?.jobs
  const shown = useMemo(() => (jobs ?? []).filter((job) => matches(job, query)), [jobs, query])
  const wantedId = /^\d{1,15}$/.test(query.trim()) ? Number(query.trim()) : null
  const listed = jobs?.find((job) => job.id === search.job)

  function choose(id: number): void {
    onSearch({ ...search, job: id })
  }

  function step(by: number): void {
    if (shown.length === 0) {
      return
    }

    const at = shown.findIndex((job) => job.id === search.job)
    const next = shown[at === -1 ? (by > 0 ? 0 : shown.length - 1) : (at + by + shown.length) % shown.length]
    if (next !== undefined) {
      choose(next.id)
    }
  }

  function ask(name: JobRequest["name"]): void {
    setRequest((last) => ({ name, serial: (last?.serial ?? 0) + 1 }))
  }

  usePageKeys(
    {
      j: () => step(1),
      k: () => step(-1),
      a: search.job === undefined ? null : () => ask("assign"),
      u: search.job === undefined ? null : () => ask("unassign"),
      x: search.job === undefined ? null : () => ask("cancel"),
      "/": () => document.getElementById("job-filter")?.focus()
    },
    true
  )

  useEffect(() => {
    if (search.job === undefined || window.matchMedia("(min-width: 64rem)").matches) {
      return
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    detailColumn.current?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" })
  }, [search.job])

  function listBody() {
    if (list.isPending) {
      return (
        <p className={styles.listState} aria-busy="true">
          {text["dispatch.list.loading"]}
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

    if (jobs === undefined || jobs.length === 0) {
      return <p className={styles.listState}>{text["dispatch.list.empty"]}</p>
    }

    if (shown.length === 0) {
      return <p className={styles.listState}>{text["dispatch.filter.none"]}</p>
    }

    return <JobList jobs={shown} selected={search.job ?? null} onSelect={choose} />
  }

  const nextCursor = list.data?.nextCursor ?? null
  const status = search.status ?? "all"

  return (
    <>
      <PageHeader
        eyebrow={text["fleet.eyebrow"]}
        title={text["dispatch.title"]}
        lead={poll ? text["dispatch.lead"] : text["fleet.paused"]}
      />
      <section className={styles.counts} aria-label={text["dispatch.counts"]} aria-busy={summary.isFetching}>
        {summary.isError && summary.data === undefined ? (
          <PanelProblem
            failure={summary.error instanceof BffError ? summary.error.failure : null}
            onRetry={() => void summary.refetch()}
          />
        ) : (
          <dl className={styles.figures}>
            <Figure
              label={text["overview.dispatch.pending"]}
              value={summary.data?.pending ?? null}
              tone="attention"
              note={text["overview.dispatch.pendingNote"]}
            />
            <Figure
              label={text["overview.dispatch.active"]}
              value={summary.data?.active ?? null}
              note={text["overview.dispatch.activeNote"]}
            />
            <Figure
              label={text["overview.dispatch.delivered"]}
              value={summary.data?.deliveredToday ?? null}
              note={text["overview.dispatch.deliveredNote"]}
            />
          </dl>
        )}
      </section>
      <KeyHints
        label={text["dispatch.keys.label"]}
        hints={[
          { keys: ["J", "K"], label: text["dispatch.keys.move"] },
          { keys: ["A"], label: text["dispatch.keys.assign"] },
          { keys: ["U"], label: text["dispatch.keys.unassign"] },
          { keys: ["X"], label: text["dispatch.keys.cancel"] },
          { keys: ["/"], label: text["dispatch.keys.filter"] }
        ]}
      />
      <div className={styles.workspace}>
        <section className={styles.listColumn} aria-labelledby="jobs-title" aria-busy={list.isFetching}>
          <div className={styles.listHead}>
            <h2 id="jobs-title" className={styles.listTitle}>
              {text["dispatch.list.title"]}
            </h2>
            <IconButton
              className={styles.refresh}
              aria-label={text["dispatch.refresh"]}
              isDisabled={list.isFetching}
              onPress={() => void list.refetch()}
            >
              <ArrowClockwise aria-hidden="true" />
            </IconButton>
          </div>
          <div className={styles.filters}>
            <span className={styles.choiceLabel} id="job-status-label">
              {text["fleet.jobStatus.label"]}
            </span>
            <ToggleButtonGroup
              aria-labelledby="job-status-label"
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[status]}
              onSelectionChange={(keys) => {
                const [picked] = [...keys]
                const next = jobStatuses.find((candidate) => candidate === picked)
                onSearch({ status: next, job: search.job })
              }}
              className={styles.statuses}
            >
              {(["all", ...jobStatuses] as const).map((candidate) => (
                <ToggleButton key={candidate} id={candidate} className={styles.status}>
                  {text[`fleet.jobStatus.${candidate}`]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <SearchField
              aria-label={text["dispatch.filter.label"]}
              value={query}
              onChange={setQuery}
              className={styles.filter}
            >
              <MagnifyingGlass aria-hidden="true" className={styles.filterIcon} />
              <Input id="job-filter" className={styles.filterInput} placeholder={text["dispatch.filter.description"]} />
            </SearchField>
            {wantedId !== null && !shown.some((job) => job.id === wantedId) ? (
              <Button variant="quiet" onPress={() => choose(wantedId)}>
                {formatText(text["dispatch.filter.open"], { id: String(wantedId) })}
                <ArrowRight aria-hidden="true" />
              </Button>
            ) : null}
          </div>
          {listBody()}
          {nextCursor === null && search.before === undefined ? null : (
            <div className={styles.pager}>
              {search.before === undefined ? (
                <span />
              ) : (
                <Button variant="quiet" onPress={() => onSearch({ status: search.status, job: search.job })}>
                  <ArrowLeft aria-hidden="true" />
                  {text["dispatch.list.newest"]}
                </Button>
              )}
              {nextCursor === null ? null : (
                <Button
                  variant="quiet"
                  onPress={() => onSearch({ status: search.status, before: nextCursor, job: search.job })}
                >
                  {text["dispatch.list.older"]}
                  <ArrowRight aria-hidden="true" />
                </Button>
              )}
            </div>
          )}
        </section>
        <div ref={detailColumn} className={styles.detailColumn}>
          {search.job === undefined ? (
            <div className={styles.idle}>
              <Path aria-hidden="true" size={28} />
              <p className={styles.idleTitle}>{text["dispatch.idle.title"]}</p>
              <p className={styles.idleBody}>{text["dispatch.idle.body"]}</p>
            </div>
          ) : (
            <JobView jobId={search.job} listed={listed} listedAt={list.dataUpdatedAt} request={request} />
          )}
        </div>
      </div>
    </>
  )
}

export { DispatchPage }
