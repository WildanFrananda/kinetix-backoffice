import type { UseQueryResult } from "@tanstack/react-query"
import { Button as IconButton, ToggleButton, ToggleButtonGroup } from "react-aria-components"
import { BffError } from "../../api/bff_error"
import { formatDistance } from "../../i18n/format_distance"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { NearbyCourier } from "../../types/nearby_courier.type"
import { Button } from "../../ui/Button"
import { ArrowClockwise } from "../../ui/icons/ArrowClockwise"
import { X } from "../../ui/icons/X"
import { Notice } from "../../ui/Notice"
import { PanelProblem } from "../../ui/PanelProblem"
import { StatusTag } from "../../ui/StatusTag"
import styles from "./Fleet.module.css"
import { useFleetText } from "./fleet_text"
import { jobFailure } from "./job_failure"
import { courierTone } from "./job_status"
import { PositionAge } from "./PositionAge"

const radii = [3, 10, 25] as const

function AssignPanel({
  nearby,
  radius,
  onRadius,
  onChoose,
  onClose
}: {
  nearby: UseQueryResult<NearbyCourier[]>
  radius: number
  onRadius: (radius: number) => void
  onChoose: (courier: NearbyCourier) => void
  onClose: () => void
}) {
  const text = useFleetText()
  const locale = useLocale()
  const numbers = new Intl.NumberFormat(locale)

  function body() {
    if (nearby.isPending) {
      return <p className={styles.listState}>{text["dispatch.assign.loading"]}</p>
    }

    if (nearby.isError) {
      const failure = nearby.error instanceof BffError ? nearby.error.failure : null
      if (failure?.kind === "refused" && failure.code === "invalid_nearby_query") {
        return <Notice tone="problem">{jobFailure(failure, null, text).lead}</Notice>
      }

      return <PanelProblem failure={failure} onRetry={() => void nearby.refetch()} />
    }

    if (nearby.data.length === 0) {
      return (
        <p className={styles.listState}>
          {formatText(text["dispatch.assign.none"], { distance: formatDistance(radius, locale) })}
        </p>
      )
    }

    return (
      <ul className={styles.candidates}>
        {nearby.data.map((courier) => (
          <li key={courier.id} className={styles.candidate} data-status={courier.status}>
            <span className={styles.candidateName}>
              {formatText(text["fleet.courier.name"], { id: String(courier.id) })}
            </span>
            <StatusTag tone={courierTone(courier.status)}>{text[`fleet.courierStatus.${courier.status}`]}</StatusTag>
            <span className={styles.candidateMeta}>
              {formatDistance(courier.distanceKm, locale)}
              {" · "}
              <PositionAge instant={courier.recordedAt} />
            </span>
            {courier.status === "online" ? (
              <Button
                variant="secondary"
                aria-label={formatText(text["dispatch.assign.chooseCourier"], { id: String(courier.id) })}
                onPress={() => onChoose(courier)}
              >
                {text["dispatch.assign.choose"]}
              </Button>
            ) : (
              <span className={styles.candidateNote}>{text["dispatch.assign.notOnline"]}</span>
            )}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <section className={styles.assign} aria-labelledby="assign-title" aria-busy={nearby.isFetching}>
      <div className={styles.assignHead}>
        <h3 id="assign-title" className={styles.sectionTitle}>
          {text["dispatch.assign.title"]}
        </h3>
        <IconButton
          className={styles.refresh}
          aria-label={text["dispatch.assign.refresh"]}
          isDisabled={nearby.isFetching}
          onPress={() => void nearby.refetch()}
        >
          <ArrowClockwise aria-hidden="true" />
        </IconButton>
        <IconButton className={styles.refresh} aria-label={text["dispatch.assign.close"]} onPress={onClose}>
          <X aria-hidden="true" />
        </IconButton>
      </div>
      <p className={styles.assignLead}>{text["dispatch.assign.lead"]}</p>
      <div className={styles.choices}>
        <span className={styles.choiceLabel} id="assign-radius">
          {text["dispatch.assign.radius"]}
        </span>
        <ToggleButtonGroup
          aria-labelledby="assign-radius"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[String(radius)]}
          onSelectionChange={(keys) => {
            const [picked] = [...keys]
            const next = radii.find((candidate) => String(candidate) === picked)
            if (next !== undefined) {
              onRadius(next)
            }
          }}
          className={styles.segments}
        >
          {radii.map((candidate) => (
            <ToggleButton key={candidate} id={String(candidate)} className={styles.segment}>
              {formatText(text["dispatch.assign.radiusValue"], { km: numbers.format(candidate) })}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>
      {body()}
    </section>
  )
}

export { AssignPanel, radii }
