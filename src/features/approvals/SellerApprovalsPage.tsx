import { useQuery } from "@tanstack/react-query"
import { Text } from "react-aria-components"
import { BffError } from "../../api/bff_error"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { ApprovalsSearch } from "../../types/approvals_search.type"
import type { SellerApplication } from "../../types/seller_application.type"
import { PageHeader } from "../../ui/PageHeader"
import { usePresence } from "../../ui/use_presence"
import { ApplicationList } from "./ApplicationList"
import styles from "./Approvals.module.css"
import { ApprovalsWorkspace } from "./ApprovalsWorkspace"
import { sellerQueueQuery } from "./approvals_queries"
import { useApprovalsText } from "./approvals_text"
import { DecisionDialog } from "./DecisionDialog"
import { DecisionNotice } from "./DecisionNotice"
import { decideSeller } from "./decide"
import { decisionFailure } from "./decision_failure"
import { searchWith } from "./queue_selection"
import { SellerDetail } from "./SellerDetail"
import { StatusFilter } from "./StatusFilter"
import { TrayFigure } from "./TrayFigure"
import { useApprovalQueue } from "./use_approval_queue"

const statuses = ["pending", "verified", "rejected"] as const

const outcomes = ["approved", "rejected"] as const

function sellerId(application: SellerApplication): number {
  return application.applicationId
}

function sellerName(application: SellerApplication): string {
  return application.storeName
}

function SellerApprovalsPage({
  search,
  onSearch
}: {
  search: ApprovalsSearch
  onSearch: (next: ApprovalsSearch) => void
}) {
  const text = useApprovalsText()
  const numbers = new Intl.NumberFormat(useLocale())
  const poll = usePresence()
  const status = statuses.find((candidate) => candidate === search.status) ?? "pending"
  const after = search.after ?? 0
  const query = sellerQueueQuery({ status, after }, poll)
  const list = useQuery(query)
  const applications = list.data?.applications
  const deciding = status === "pending"

  const queue = useApprovalQueue({
    queue: "sellers",
    listKey: query.queryKey,
    applications,
    idOf: sellerId,
    deciding,
    wanted: search.selected,
    onSelect: (id) => onSearch(searchWith(search, { selected: id })),
    outcomes,
    decide: decideSeller
  })

  const asking = queue.asking
  const failure = queue.error instanceof BffError ? decisionFailure(queue.error.failure, text, "sellers") : null
  const waiting =
    applications === undefined
      ? "—"
      : `${numbers.format(applications.length)}${list.data?.nextAfterId === null ? "" : "+"}`

  return (
    <>
      <PageHeader
        eyebrow={text["approvals.eyebrow"]}
        title={text["approvals.sellers.title"]}
        lead={poll ? text["approvals.sellers.lead"] : text["overview.paused"]}
      />
      <ApprovalsWorkspace
        queue="sellers"
        poll={poll}
        filter={
          <StatusFilter
            statuses={statuses}
            status={status}
            onChange={(next) => onSearch(searchWith({}, { status: next }))}
          />
        }
        figure={
          deciding ? (
            <TrayFigure
              model={queue.model}
              waiting={waiting}
              approved={queue.tally.approved}
              rejected={queue.tally.rejected}
              canReject
            />
          ) : null
        }
        canReject={deciding}
        listTitle={text[`approvals.list.${status}`]}
        list={
          <ApplicationList
            label={text["approvals.sellers.title"]}
            applications={applications ?? []}
            idOf={sellerId}
            nameOf={sellerName}
            selected={queue.selectedId}
            onSelect={queue.select}
          >
            {(application) => (
              <>
                <Text slot="label" className={styles.itemName}>
                  {application.storeName}
                </Text>
                <span className={styles.itemNumber}>#{application.applicationId}</span>
                <Text slot="description" className={styles.itemMeta}>
                  {application.email}
                </Text>
                <span className={styles.itemAside}>{application.city}</span>
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
        notice={<DecisionNotice queue="sellers" report={queue.report} />}
        selectedKey={queue.selectedId}
        detail={queue.selected === null ? null : <SellerDetail application={queue.selected} onAsk={queue.ask} />}
      />
      <DecisionDialog
        open={queue.open}
        kind={asking?.kind ?? "approve"}
        title={formatText(
          text[
            asking?.kind === "reject" ? "approvals.confirm.rejectSeller.title" : "approvals.confirm.approveSeller.title"
          ],
          { name: asking?.application.storeName ?? "" }
        )}
        body={
          text[
            asking?.kind === "reject" ? "approvals.confirm.rejectSeller.body" : "approvals.confirm.approveSeller.body"
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

export { SellerApprovalsPage }
