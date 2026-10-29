import { useQuery } from "@tanstack/react-query"
import { Text } from "react-aria-components"
import { BffError } from "../../api/bff_error"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { ApprovalsSearch } from "../../types/approvals_search.type"
import type { CourierApplication } from "../../types/courier_application.type"
import { PageHeader } from "../../ui/PageHeader"
import { relative } from "../../ui/RelativeTime"
import { usePresence } from "../../ui/use_presence"
import { ApplicationList } from "./ApplicationList"
import styles from "./Approvals.module.css"
import { ApprovalsWorkspace } from "./ApprovalsWorkspace"
import { courierQueueQuery } from "./approvals_queries"
import { useApprovalsText } from "./approvals_text"
import { CourierDetail } from "./CourierDetail"
import { DecisionDialog } from "./DecisionDialog"
import { DecisionNotice } from "./DecisionNotice"
import { decideCourier } from "./decide"
import { decisionFailure } from "./decision_failure"
import { searchWith } from "./queue_selection"
import { StatusFilter } from "./StatusFilter"
import { TrayFigure } from "./TrayFigure"
import { useApprovalQueue } from "./use_approval_queue"
import { useDecisionTallies } from "./use_decision_tallies"

const statuses = ["pending", "approved", "rejected"] as const

const outcomes = ["approved", "rejected"] as const

function courierId(application: CourierApplication): number {
  return application.applicationId
}

function courierName(application: CourierApplication): string {
  return application.email
}

function CourierApprovalsPage({
  search,
  onSearch
}: {
  search: ApprovalsSearch
  onSearch: (next: ApprovalsSearch) => void
}) {
  const text = useApprovalsText()
  const locale = useLocale()
  const numbers = new Intl.NumberFormat(locale)
  const poll = usePresence()
  const status = statuses.find((candidate) => candidate === search.status) ?? "pending"
  const after = search.after ?? 0
  const query = courierQueueQuery({ status, after }, poll)
  const list = useQuery(query)
  const applications = list.data?.applications
  const deciding = status === "pending"
  const tallies = useDecisionTallies("couriers", { poll, enabled: deciding })

  const queue = useApprovalQueue({
    queue: "couriers",
    listKey: query.queryKey,
    applications,
    idOf: courierId,
    deciding,
    wanted: search.selected,
    onSelect: (id) => onSearch(searchWith(search, { selected: id })),
    outcomes,
    decide: decideCourier,
    onDecided: tallies.count
  })

  const asking = queue.asking
  const failure = queue.error instanceof BffError ? decisionFailure(queue.error.failure, text, "couriers") : null
  const waiting =
    applications === undefined
      ? "—"
      : `${numbers.format(applications.length)}${list.data?.nextAfterId === null ? "" : "+"}`

  return (
    <>
      <PageHeader
        eyebrow={text["approvals.eyebrow"]}
        title={text["approvals.couriers.title"]}
        lead={poll ? text["approvals.couriers.lead"] : text["overview.paused"]}
      />
      <ApprovalsWorkspace
        queue="couriers"
        poll={poll}
        filter={
          <StatusFilter
            statuses={statuses}
            status={status}
            onChange={(next) => onSearch(searchWith({}, { status: next }))}
          />
        }
        figure={deciding ? <TrayFigure model={queue.model} waiting={waiting} periods={tallies.rows} /> : null}
        canReject={deciding}
        listTitle={text[`approvals.list.${status}`]}
        list={
          <ApplicationList
            label={text["approvals.couriers.title"]}
            applications={applications ?? []}
            idOf={courierId}
            nameOf={courierName}
            selected={queue.selectedId}
            onSelect={queue.select}
          >
            {(application) => (
              <>
                <Text slot="label" className={styles.itemName}>
                  {application.email}
                </Text>
                <span className={styles.itemNumber}>#{application.applicationId}</span>
                <Text slot="description" className={styles.itemMeta}>
                  {application.driverId === null
                    ? text["approvals.list.noDriver"]
                    : formatText(text["approvals.list.driver"], { id: String(application.driverId) })}
                </Text>
                <span className={styles.itemAside}>{relative(application.filedAt.getTime() - Date.now(), locale)}</span>
              </>
            )}
          </ApplicationList>
        }
        loading={list.isPending}
        error={list.isError && list.data === undefined ? list.error : null}
        empty={applications?.length === 0}
        emptyText={text[deciding ? "approvals.empty.pending" : "approvals.empty.other"]}
        refreshing={list.isFetching}
        onRefresh={() => void list.refetch()}
        hasNext={list.data?.nextAfterId !== null && list.data?.nextAfterId !== undefined}
        hasPrevious={after > 0}
        onNext={() => onSearch(searchWith({ status }, { after: list.data?.nextAfterId ?? 0 }))}
        onFirst={() => onSearch(searchWith({ status }, {}))}
        notice={<DecisionNotice queue="couriers" report={queue.report} />}
        selectedKey={queue.selectedId}
        detail={queue.selected === null ? null : <CourierDetail application={queue.selected} onAsk={queue.ask} />}
      />
      <DecisionDialog
        open={queue.open}
        kind={asking?.kind ?? "approve"}
        title={formatText(
          text[
            asking?.kind === "reject"
              ? "approvals.confirm.rejectCourier.title"
              : "approvals.confirm.approveCourier.title"
          ],
          { name: asking?.application.email ?? "" }
        )}
        body={
          text[
            asking?.kind === "reject" ? "approvals.confirm.rejectCourier.body" : "approvals.confirm.approveCourier.body"
          ]
        }
        pending={queue.pending}
        failure={failure}
        onConfirm={queue.confirm}
        onClose={queue.close}
      />
    </>
  )
}

export { CourierApprovalsPage }
