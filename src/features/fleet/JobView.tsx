import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useEffect, useMemo, useRef, useState } from "react"
import { BffError } from "../../api/bff_error"
import { formatDistance } from "../../i18n/format_distance"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import { distanceKm } from "../../map/distance"
import type { DispatchJob } from "../../types/dispatch_job.type"
import type { JobRequest } from "../../types/job_request.type"
import type { NearbyCourier } from "../../types/nearby_courier.type"
import { Button } from "../../ui/Button"
import { ArrowUUpLeft } from "../../ui/icons/ArrowUUpLeft"
import { Moped } from "../../ui/icons/Moped"
import { XCircle } from "../../ui/icons/XCircle"
import { StreetMap } from "../../ui/map/StreetMap"
import { Notice } from "../../ui/Notice"
import { PanelProblem } from "../../ui/PanelProblem"
import { RelativeTime } from "../../ui/RelativeTime"
import { StatusTag } from "../../ui/StatusTag"
import { shortPrincipal } from "../stock/short_principal"
import { AssignPanel, radii } from "./AssignPanel"
import styles from "./Fleet.module.css"
import { courierQuery, jobKey, jobQuery, nearbyQuery } from "./fleet_queries"
import { useFleetText } from "./fleet_text"
import { JobDialog } from "./JobDialog"
import { courierTone, jobTone } from "./job_status"
import { chosenId, jobFrame, jobScene } from "./map_scenes"
import { PositionAge } from "./PositionAge"
import { ProofOfDelivery } from "./ProofOfDelivery"
import { pointText } from "./point_text"
import { useJobActions } from "./use_job_actions"

const noCouriers: readonly NearbyCourier[] = []

function cancellable(job: DispatchJob): boolean {
  return job.orderNumber === null && (job.status === "pending" || job.status === "assigned")
}

function JobView({
  jobId,
  listed,
  listedAt,
  request
}: {
  jobId: number
  listed: DispatchJob | undefined
  listedAt: number
  request: JobRequest | null
}) {
  const text = useFleetText()
  const locale = useLocale()
  const client = useQueryClient()
  const job = useQuery(jobQuery(jobId))
  const value = job.data
  const courierId = value?.courierId ?? null
  const holder = useQuery(courierQuery(courierId))
  const holderCourier = courierId === null ? null : (holder.data ?? null)
  const [assigningFor, setAssigningFor] = useState<number | null>(null)
  const [radius, setRadius] = useState<number>(radii[0])
  const assigning = assigningFor === jobId && value?.status === "pending"
  const nearby = useQuery(
    nearbyQuery(assigning && value !== undefined && value !== null ? { near: value.pickup, radiusKm: radius } : null)
  )

  const actions = useJobActions(jobId, text)
  const handled = useRef(0)
  const labels = useMemo(() => ({ pickup: text["fleet.map.pickup"], dropoff: text["fleet.map.dropoff"] }), [text])
  const candidates = useMemo(() => (assigning ? (nearby.data ?? noCouriers) : noCouriers), [assigning, nearby.data])
  const scene = useMemo(
    () => (value === undefined || value === null ? null : jobScene(value, holderCourier, candidates, labels)),
    [value, holderCourier, candidates, labels]
  )

  useEffect(() => {
    if (listed === undefined || value === undefined || value === null || actions.busy) {
      return
    }

    const newer = listedAt > job.dataUpdatedAt
    if (newer && (listed.status !== value.status || listed.courierId !== value.courierId)) {
      void client.invalidateQueries({ queryKey: jobKey(jobId) })
    }
  }, [client, jobId, listed, listedAt, value, job.dataUpdatedAt, actions.busy])

  useEffect(() => {
    if (request === null || request.serial === handled.current) {
      return
    }

    handled.current = request.serial

    if (value === undefined || value === null) {
      return
    }

    if (request.name === "assign" && value.status === "pending") {
      setAssigningFor(jobId)
    }

    if (request.name === "unassign" && value.status === "assigned" && value.courierId !== null) {
      actions.ask({ kind: "unassign", courierId: value.courierId })
    }

    if (request.name === "cancel" && cancellable(value)) {
      actions.ask({ kind: "cancel" })
    }
  }, [request, value, jobId, actions])

  if (value === undefined) {
    if (job.isError) {
      return (
        <PanelProblem
          failure={job.error instanceof BffError ? job.error.failure : null}
          onRetry={() => void job.refetch()}
        />
      )
    }

    return (
      <p className={styles.listState} aria-busy="true">
        {text["dispatch.detail.loading"]}
      </p>
    )
  }

  if (value === null || scene === null) {
    return <Notice tone="info">{formatText(text["dispatch.detail.gone"], { id: String(jobId) })}</Notice>
  }

  const shown = value

  function choose(placeId: string): void {
    const chosen = chosenId(placeId)
    if (chosen === null || chosen.kind !== "courier") {
      return
    }

    const candidate = candidates.find((courier) => courier.id === chosen.id)
    if (candidate !== undefined && candidate.status === "online") {
      actions.ask({ kind: "assign", courierId: candidate.id, distanceKm: candidate.distanceKm })
    }
  }

  const frame = assigning
    ? [shown.pickup, ...candidates.flatMap((courier) => (courier.position === null ? [] : [courier.position]))]
    : jobFrame(shown, holderCourier)

  const frameKey = assigning
    ? `${jobId}|near|${radius}|${nearby.dataUpdatedAt}`
    : `${jobId}|${holderCourier?.id ?? ""}|${holderCourier?.position === null || holderCourier === null ? "" : "at"}`

  const report = actions.report
  const values = { id: String(shown.id) }

  function courierBody() {
    if (shown.courierId === null) {
      return <p className={styles.sectionBody}>{text["dispatch.courier.none"]}</p>
    }

    const idText = String(shown.courierId)

    if (holder.isPending) {
      return <p className={styles.sectionBody}>{text["dispatch.courier.loading"]}</p>
    }

    if (holder.isError) {
      return (
        <PanelProblem
          failure={holder.error instanceof BffError ? holder.error.failure : null}
          onRetry={() => void holder.refetch()}
        />
      )
    }

    const link = (
      <Link to="/fleet" search={{ courier: shown.courierId }} className={styles.link}>
        {text["dispatch.courier.open"]}
      </Link>
    )

    if (holderCourier === null) {
      return (
        <div className={styles.sectionBody}>
          <p>{formatText(text["dispatch.courier.notTracked"], { id: idText })}</p>
          {link}
        </div>
      )
    }

    return (
      <div className={styles.courierLine}>
        <span className={styles.candidateName}>{formatText(text["fleet.courier.name"], { id: idText })}</span>
        <StatusTag tone={courierTone(holderCourier.status)}>
          {text[`fleet.courierStatus.${holderCourier.status}`]}
        </StatusTag>
        <span className={styles.candidateMeta}>
          <PositionAge instant={holderCourier.recordedAt} />
          {holderCourier.position === null
            ? null
            : ` · ${formatText(text["dispatch.courier.toPickup"], {
                distance: formatDistance(distanceKm(holderCourier.position, shown.pickup), locale)
              })}`}
        </span>
        {link}
      </div>
    )
  }

  return (
    <article className={styles.detail} aria-labelledby="job-title">
      <header className={styles.detailHead}>
        <p className={styles.kicker}>
          {text["dispatch.detail.kicker"]}
          <StatusTag tone={jobTone(shown.status)}>{text[`fleet.jobStatus.${shown.status}`]}</StatusTag>
        </p>
        <h2 id="job-title" className={styles.detailTitle}>
          {formatText(text["fleet.job.name"], values)}
        </h2>
        <div className={styles.detailActions}>
          {shown.status === "pending" ? (
            <Button isDisabled={assigning} onPress={() => setAssigningFor(jobId)}>
              <Moped aria-hidden="true" />
              {text["dispatch.action.assign"]}
            </Button>
          ) : null}
          {shown.status === "assigned" && shown.courierId !== null ? (
            <Button
              variant="secondary"
              isDisabled={actions.busy}
              onPress={() => {
                if (shown.courierId !== null) {
                  actions.ask({ kind: "unassign", courierId: shown.courierId })
                }
              }}
            >
              <ArrowUUpLeft aria-hidden="true" />
              {text["dispatch.action.unassign"]}
            </Button>
          ) : null}
          {cancellable(shown) ? (
            <Button variant="secondary" isDisabled={actions.busy} onPress={() => actions.ask({ kind: "cancel" })}>
              <XCircle aria-hidden="true" />
              {text["dispatch.action.cancel"]}
            </Button>
          ) : null}
        </div>
        {shown.orderNumber !== null && (shown.status === "pending" || shown.status === "assigned") ? (
          <p className={styles.detailLead}>{formatText(text["dispatch.bound"], { order: shown.orderNumber })}</p>
        ) : null}
      </header>
      {report === null ? null : report.tone === "problem" ? (
        <div className={styles.report}>
          <Notice tone="problem">
            {report.text}
            {report.quote === null ? null : (
              <q className={styles.quote} lang="en">
                {report.quote}
              </q>
            )}
          </Notice>
          {report.retry === null && !report.readAgain ? null : (
            <div className={styles.detailActions}>
              {report.retry === null ? null : (
                <Button
                  variant="secondary"
                  onPress={() => {
                    if (report.retry !== null) {
                      actions.ask(report.retry)
                    }
                  }}
                >
                  {text["dispatch.report.retry"]}
                </Button>
              )}
              {report.readAgain ? (
                <Button variant="secondary" onPress={actions.readAgain}>
                  {text["dispatch.report.readAgain"]}
                </Button>
              ) : null}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.report}>
          <Notice tone="info">{report.text}</Notice>
        </div>
      )}
      <StreetMap
        label={formatText(text["dispatch.map.label"], values)}
        scene={scene}
        frame={frame}
        frameKey={frameKey}
        onChoose={choose}
      />
      {assigning ? (
        <AssignPanel
          nearby={nearby}
          radius={radius}
          onRadius={setRadius}
          onChoose={(courier) => actions.ask({ kind: "assign", courierId: courier.id, distanceKm: courier.distanceKm })}
          onClose={() => setAssigningFor(null)}
        />
      ) : null}
      <section className={styles.section} aria-labelledby="job-facts">
        <h3 id="job-facts" className={styles.sectionTitle}>
          {text["dispatch.detail.facts"]}
        </h3>
        <dl className={styles.facts}>
          <div className={styles.fact}>
            <dt>{text["dispatch.detail.order"]}</dt>
            <dd className={styles.mono}>{shown.orderNumber ?? text["dispatch.detail.none"]}</dd>
          </div>
          <div className={styles.fact}>
            <dt>{text["dispatch.detail.awb"]}</dt>
            <dd className={styles.mono}>{shown.awbNumber ?? text["dispatch.detail.none"]}</dd>
          </div>
          <div className={styles.fact}>
            <dt>{text["dispatch.detail.merchant"]}</dt>
            <dd className={styles.mono}>
              {shown.merchantPrincipalId === null
                ? text["dispatch.detail.none"]
                : shortPrincipal(shown.merchantPrincipalId)}
            </dd>
          </div>
          <div className={styles.fact}>
            <dt>{text["dispatch.detail.weight"]}</dt>
            <dd>{formatText(text["fleet.weight"], { kg: new Intl.NumberFormat(locale).format(shown.weightKg) })}</dd>
          </div>
          <div className={styles.fact}>
            <dt>{text["dispatch.detail.distance"]}</dt>
            <dd>
              {formatText(text["fleet.straightLine"], {
                distance: formatDistance(distanceKm(shown.pickup, shown.dropoff), locale)
              })}
            </dd>
          </div>
          <div className={styles.fact}>
            <dt>{text["dispatch.detail.pickup"]}</dt>
            <dd className={styles.mono}>{pointText(shown.pickup)}</dd>
          </div>
          <div className={styles.fact}>
            <dt>{text["dispatch.detail.dropoff"]}</dt>
            <dd className={styles.mono}>{pointText(shown.dropoff)}</dd>
          </div>
        </dl>
      </section>
      <section className={styles.section} aria-labelledby="job-timeline">
        <h3 id="job-timeline" className={styles.sectionTitle}>
          {text["dispatch.timeline.title"]}
        </h3>
        <ol className={styles.timeline}>
          <li className={styles.step} data-done="true">
            <span>{text["dispatch.timeline.created"]}</span>
            <RelativeTime instant={shown.insertedAt} />
          </li>
          <li className={styles.step} data-done={shown.assignedAt !== null}>
            <span>{text["dispatch.timeline.assigned"]}</span>
            {shown.assignedAt === null ? (
              <span>{text["dispatch.timeline.notYet"]}</span>
            ) : (
              <RelativeTime instant={shown.assignedAt} />
            )}
          </li>
          <li className={styles.step} data-done={shown.deliveredAt !== null}>
            <span>{text["dispatch.timeline.delivered"]}</span>
            {shown.deliveredAt === null ? (
              <span>{text["dispatch.timeline.notYet"]}</span>
            ) : (
              <RelativeTime instant={shown.deliveredAt} />
            )}
          </li>
        </ol>
      </section>
      <section className={styles.section} aria-labelledby="job-courier">
        <h3 id="job-courier" className={styles.sectionTitle}>
          {text["dispatch.courier.title"]}
        </h3>
        {courierBody()}
      </section>
      {shown.status === "delivered" ? <ProofOfDelivery job={shown} onReadAgain={actions.readAgain} /> : null}
      <JobDialog
        jobId={shown.id}
        action={actions.asked}
        working={actions.cancelling}
        problem={actions.problem}
        onConfirm={() => void actions.confirm()}
        onClose={actions.dismiss}
      />
    </article>
  )
}

export { JobView }
