import type { UseQueryResult } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { BffError } from "../../api/bff_error"
import { formatDistance } from "../../i18n/format_distance"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import { distanceKm } from "../../map/distance"
import type { CourierViewState } from "../../types/courier_view_state.type"
import type { DispatchJob } from "../../types/dispatch_job.type"
import { Notice } from "../../ui/Notice"
import { PanelProblem } from "../../ui/PanelProblem"
import { RelativeTime } from "../../ui/RelativeTime"
import { StatusTag } from "../../ui/StatusTag"
import styles from "./Fleet.module.css"
import { useFleetText } from "./fleet_text"
import { courierTone, jobTone } from "./job_status"
import { pointText } from "./point_text"

function CourierView({
  courierId,
  state,
  jobs
}: {
  courierId: number
  state: CourierViewState
  jobs: UseQueryResult<DispatchJob[]>
}) {
  const text = useFleetText()
  const locale = useLocale()
  const numbers = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
  const values = { id: String(courierId) }

  if (state.kind === "failed") {
    return <PanelProblem failure={state.failure} onRetry={state.retry} />
  }

  if (state.kind === "loading") {
    return (
      <p className={styles.listState} aria-busy="true">
        {text["fleet.detail.loading"]}
      </p>
    )
  }

  const known = state.courier

  if (known === null) {
    return <Notice tone="info">{formatText(text["fleet.detail.notTracked"], values)}</Notice>
  }

  function jobsBody() {
    if (jobs.isPending) {
      return <p className={styles.sectionBody}>{text["fleet.jobs.loading"]}</p>
    }

    if (jobs.isError) {
      return (
        <PanelProblem
          failure={jobs.error instanceof BffError ? jobs.error.failure : null}
          onRetry={() => void jobs.refetch()}
        />
      )
    }

    if (jobs.data.length === 0) {
      return <p className={styles.sectionBody}>{text["fleet.jobs.none"]}</p>
    }

    return (
      <ul className={styles.candidates}>
        {jobs.data.map((job) => (
          <li key={job.id} className={styles.candidate}>
            <span className={styles.candidateName}>{formatText(text["fleet.job.name"], { id: String(job.id) })}</span>
            <StatusTag tone={jobTone(job.status)}>{text[`fleet.jobStatus.${job.status}`]}</StatusTag>
            <span className={styles.candidateMeta}>
              {job.orderNumber ?? text["dispatch.item.noOrder"]} ·{" "}
              {formatText(text["fleet.straightLine"], {
                distance: formatDistance(distanceKm(job.pickup, job.dropoff), locale)
              })}
            </span>
            <Link to="/dispatch" search={{ job: job.id }} className={styles.link}>
              {formatText(text["fleet.jobs.open"], { id: String(job.id) })}
            </Link>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <article className={styles.detail} aria-labelledby="courier-title">
      <header className={styles.detailHead}>
        <p className={styles.kicker}>
          {text["fleet.detail.kicker"]}
          <StatusTag tone={courierTone(known.status)}>{text[`fleet.courierStatus.${known.status}`]}</StatusTag>
        </p>
        <h2 id="courier-title" className={styles.detailTitle}>
          {formatText(text["fleet.courier.name"], values)}
        </h2>
      </header>
      <section className={styles.section} aria-labelledby="courier-facts">
        <h3 id="courier-facts" className={styles.sectionTitle}>
          {text["fleet.detail.facts"]}
        </h3>
        <dl className={styles.facts}>
          <div className={styles.fact}>
            <dt>{text["fleet.detail.duty"]}</dt>
            <dd>{text[`fleet.courierStatus.${known.status}`]}</dd>
          </div>
          <div className={styles.fact}>
            <dt>{text["fleet.detail.position"]}</dt>
            <dd className={styles.mono}>
              {known.position === null ? text["fleet.position.none"] : pointText(known.position)}
            </dd>
          </div>
          <div className={styles.fact}>
            <dt>{text["fleet.detail.recorded"]}</dt>
            <dd>
              {known.recordedAt === null ? text["fleet.detail.unknown"] : <RelativeTime instant={known.recordedAt} />}
            </dd>
          </div>
          <div className={styles.fact}>
            <dt>{text["fleet.detail.speed"]}</dt>
            <dd>
              {known.speedKmh === null
                ? text["fleet.detail.unknown"]
                : formatText(text["fleet.detail.speedValue"], { speed: numbers.format(known.speedKmh) })}
            </dd>
          </div>
          <div className={styles.fact}>
            <dt>{text["fleet.detail.heading"]}</dt>
            <dd>
              {known.bearingDeg === null
                ? text["fleet.detail.unknown"]
                : formatText(text["fleet.detail.headingValue"], { degrees: numbers.format(known.bearingDeg) })}
            </dd>
          </div>
          <div className={styles.fact}>
            <dt>{text["fleet.detail.synced"]}</dt>
            <dd>
              {known.updatedAt === null ? text["fleet.detail.unknown"] : <RelativeTime instant={known.updatedAt} />}
            </dd>
          </div>
        </dl>
      </section>
      <section className={styles.section} aria-labelledby="courier-jobs">
        <h3 id="courier-jobs" className={styles.sectionTitle}>
          {text["fleet.jobs.title"]}
        </h3>
        {jobsBody()}
      </section>
    </article>
  )
}

export { CourierView }
