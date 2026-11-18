import { useQuery } from "@tanstack/react-query"
import { BffError } from "../../api/bff_error"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { CaseDetailProps } from "../../types/case_detail_props.type"
import { CopyValue } from "../../ui/CopyValue"
import { ShieldCheck } from "../../ui/icons/ShieldCheck"
import { Notice } from "../../ui/Notice"
import { PanelProblem } from "../../ui/PanelProblem"
import { StatusTag } from "../../ui/StatusTag"
import styles from "./Cases.module.css"
import { caseFailure } from "./case_failure"
import { merchantHeading, standingLabel, standingTone, timestampLabel, windowLabel } from "./case_format"
import { caseDetailQuery } from "./cases_queries"
import { useCasesText } from "./cases_text"

function CaseDetail({ merchantId, status }: CaseDetailProps) {
  const text = useCasesText()
  const locale = useLocale()
  const numbers = new Intl.NumberFormat(locale)
  const detail = useQuery(caseDetailQuery(merchantId, status))

  if (detail.isPending) {
    return (
      <p className={styles.listState} aria-busy="true">
        {text["cases.reports.loading"]}
      </p>
    )
  }

  if (detail.isError) {
    if (detail.error instanceof BffError) {
      const explained = caseFailure(detail.error.failure, text)

      return (
        <Notice tone="problem">
          {explained.lead}
          {explained.quote === null ? null : ` (${explained.quote})`}
        </Notice>
      )
    }

    return <PanelProblem failure={null} onRetry={() => void detail.refetch()} />
  }

  const record = detail.data
  const heading = merchantHeading(record, text, "detail")

  return (
    <article className={styles.detail} aria-labelledby="case-detail-title">
      <header className={styles.detailHead}>
        <p className={styles.kicker}>
          <ShieldCheck aria-hidden="true" />
          {text["cases.detail.kicker"]}
        </p>
        <div className={styles.detailTitleRow}>
          <h2 id="case-detail-title" className={styles.detailTitle}>
            {heading}
          </h2>
          <StatusTag tone={standingTone(record.merchant.status)}>
            {standingLabel(record.merchant.status, text)}
          </StatusTag>
        </div>
      </header>

      <dl className={styles.facts}>
        <dt>{text["cases.detail.principal"]}</dt>
        <dd>
          <CopyValue value={record.merchantPrincipalId} label={text["cases.detail.principal"]} />
        </dd>
        <dt>{text["cases.detail.tag"]}</dt>
        <dd>
          <CopyValue value={record.merchantTag} label={text["cases.detail.tag"]} />
        </dd>
        <dt>{text["cases.detail.confirmed"]}</dt>
        <dd>{numbers.format(record.confirmedCount)}</dd>
        <dt>{text["cases.detail.pending"]}</dt>
        <dd>{numbers.format(record.pendingCount)}</dd>
        <dt>{text["cases.detail.windows"]}</dt>
        <dd>
          {formatText(text["cases.detail.windowRange"], {
            count: numbers.format(record.windowCount),
            earliest: windowLabel(record.earliestWindow),
            latest: windowLabel(record.latestWindow)
          })}
        </dd>
        <dt>{text["cases.detail.latest"]}</dt>
        <dd>{timestampLabel(record.latestReportedAt, locale)}</dd>
      </dl>

      <section className={styles.section} aria-labelledby="case-categories-title">
        <h3 id="case-categories-title" className={styles.sectionTitle}>
          {text["cases.categories.title"]}
        </h3>
        <ul className={styles.categories}>
          {record.categories.map((category) => (
            <li key={category.slug} className={styles.categoryChip}>
              <span>{category.label}</span>
              <span className={styles.categoryCount}>{numbers.format(category.count)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="case-reports-title">
        <h3 id="case-reports-title" className={styles.sectionTitle}>
          {text["cases.reports.title"]}
        </h3>
        {record.reports.length === 0 ? (
          <p className={styles.listState}>{text["cases.reports.empty"]}</p>
        ) : (
          <ul className={styles.reports}>
            {record.reports.map((report) => (
              <li key={report.nullifier} className={styles.reportCard}>
                <div className={styles.reportTop}>
                  <span className={styles.reportCategory}>{report.category.label}</span>
                  <div className={styles.reportTags}>
                    <span>{formatText(text["cases.report.window"], { window: windowLabel(report.window) })}</span>
                    <span>
                      {formatText(text["cases.report.generation"], {
                        generation: numbers.format(report.firstGeneration)
                      })}
                    </span>
                    <StatusTag tone={report.status === "confirmed" ? "settled" : "attention"}>
                      {report.status === "confirmed" ? text["cases.report.confirmed"] : text["cases.report.submitted"]}
                    </StatusTag>
                  </div>
                </div>
                <p className={styles.reportBody}>{report.body}</p>
                <div className={styles.reportMeta}>
                  <span>
                    {formatText(text["cases.report.submittedAt"], {
                      when: timestampLabel(report.submittedAt, locale)
                    })}
                    {report.confirmedAt === null
                      ? ""
                      : ` · ${formatText(text["cases.report.confirmedAt"], { when: timestampLabel(report.confirmedAt, locale) })}`}
                  </span>
                  <div className={styles.reportProof}>
                    <span>{text["cases.report.nullifier"]}:</span>
                    <CopyValue value={report.nullifier} label={text["cases.report.nullifier"]} />
                  </div>
                  <div className={styles.reportProof}>
                    <span>{text["cases.report.txId"]}:</span>
                    {report.txId === null ? (
                      <span>{text["cases.report.txPending"]}</span>
                    ) : (
                      <CopyValue value={report.txId} label={text["cases.report.txId"]} />
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  )
}

export { CaseDetail }
