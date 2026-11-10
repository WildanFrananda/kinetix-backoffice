import { Link } from "@tanstack/react-router"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { AttentionSaga } from "../../types/attention_saga.type"
import { CopyValue } from "../../ui/CopyValue"
import { LinkBreak } from "../../ui/icons/LinkBreak"
import { StatusTag } from "../../ui/StatusTag"
import styles from "./Orders.module.css"
import { orderTone } from "./order_tone"
import { useOrdersText } from "./orders_text"

function SagaView({ saga }: { saga: AttentionSaga }) {
  const text = useOrdersText()
  const locale = useLocale()
  const numbers = new Intl.NumberFormat(locale)
  const exact = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "medium" })

  function moment(instant: Date | null) {
    return instant === null ? <span className={styles.quiet}>{text["sagas.detail.never"]}</span> : exact.format(instant)
  }

  return (
    <article className={styles.detail} aria-labelledby="saga-title">
      <header className={styles.detailHead}>
        <p className={styles.kicker}>
          <LinkBreak aria-hidden="true" />
          {text["sagas.detail.kicker"]}
        </p>
        <h2 id="saga-title" className={styles.detailTitle}>
          <span>{saga.orderNumber}</span>
          <StatusTag tone={saga.state === "Abandoned" ? "attention" : "neutral"}>
            {text[`sagas.state.${saga.state}`]}
          </StatusTag>
        </h2>
        <p className={styles.detailLead}>
          {saga.state === "Abandoned" ? text["sagas.detail.abandonedLead"] : text["sagas.detail.lead"]}
        </p>
      </header>
      <dl className={styles.facts}>
        <dt>{text["sagas.detail.order"]}</dt>
        <dd>
          <Link to="/orders" search={{ orderNumber: saga.orderNumber }} className={styles.inlineLink}>
            {formatText(text["sagas.detail.findOrder"], { number: saga.orderNumber })}
          </Link>
        </dd>
        <dt>{text["sagas.detail.orderStatus"]}</dt>
        <dd>
          {saga.orderStatus === null ? (
            <span className={styles.quiet}>{text["sagas.detail.noOrder"]}</span>
          ) : (
            <StatusTag tone={orderTone(saga.orderStatus)}>{text[`orders.status.${saga.orderStatus}`]}</StatusTag>
          )}
        </dd>
        <dt>{text["sagas.detail.buyer"]}</dt>
        <dd className={styles.mono}>
          <CopyValue value={saga.customerPrincipalId} label={text["sagas.detail.buyer"]} />
        </dd>
        <dt>{text["sagas.detail.attempts"]}</dt>
        <dd>{numbers.format(saga.compensationAttempts)}</dd>
        <dt>{text["sagas.detail.failureCode"]}</dt>
        <dd className={styles.mono}>{saga.lastFailureCode ?? text["sagas.detail.never"]}</dd>
        <dt>{text["sagas.detail.failureReason"]}</dt>
        <dd>
          {saga.failureReason === null ? (
            <span className={styles.quiet}>{text["sagas.detail.never"]}</span>
          ) : (
            <q lang="en">{saga.failureReason}</q>
          )}
        </dd>
        <dt>{text["sagas.detail.flagged"]}</dt>
        <dd>{moment(saga.needsAttentionAt)}</dd>
        <dt>{text["sagas.detail.abandoned"]}</dt>
        <dd>{moment(saga.abandonedAt)}</dd>
        <dt>{text["sagas.detail.updated"]}</dt>
        <dd>{moment(saga.updatedAt)}</dd>
        <dt>{text["sagas.detail.sagaId"]}</dt>
        <dd className={styles.mono}>
          <CopyValue value={saga.sagaId} label={text["sagas.detail.sagaId"]} />
        </dd>
        <dt>{text["sagas.detail.correlation"]}</dt>
        <dd className={styles.mono}>
          <CopyValue value={saga.correlationId} label={text["sagas.detail.correlation"]} />
        </dd>
      </dl>
      <section className={styles.section} aria-labelledby="saga-steps-title">
        <h3 id="saga-steps-title" className={styles.sectionTitle}>
          {text["sagas.steps.title"]}
        </h3>
        <p className={styles.note}>{text["sagas.steps.note"]}</p>
        {saga.unreleasedSteps.length === 0 ? (
          <p className={styles.sectionBody}>{text["sagas.steps.empty"]}</p>
        ) : (
          <ol className={styles.steps}>
            {saga.unreleasedSteps.map((step) => (
              <li
                key={`${step.name}:${step.reference}:${step.merchantPrincipalId}:${step.productId ?? ""}`}
                className={styles.step}
              >
                <h4 className={styles.stepHead}>
                  {text[`sagas.step.${step.name}`]}
                  <span className={styles.stepCode}>{step.name}</span>
                  <StatusTag tone={step.state === "Failed" ? "attention" : "neutral"}>
                    {text[`sagas.stepState.${step.state}`]}
                  </StatusTag>
                </h4>
                <dl className={styles.facts}>
                  <dt>{text["sagas.steps.reference"]}</dt>
                  <dd className={styles.mono}>{step.reference}</dd>
                  <dt>{text["sagas.steps.quantity"]}</dt>
                  <dd>{numbers.format(step.quantity)}</dd>
                  <dt>{text["sagas.steps.merchant"]}</dt>
                  <dd className={styles.mono}>{step.merchantPrincipalId}</dd>
                  <dt>{text["sagas.steps.product"]}</dt>
                  <dd className={styles.mono}>{step.productId ?? text["sagas.detail.never"]}</dd>
                  <dt>{text["sagas.steps.attempts"]}</dt>
                  <dd>{numbers.format(step.compensationAttempts)}</dd>
                  <dt>{text["sagas.steps.failure"]}</dt>
                  <dd className={styles.mono}>{step.lastFailureCode ?? text["sagas.detail.never"]}</dd>
                  <dt>{text["sagas.steps.detail"]}</dt>
                  <dd>
                    {step.detail === null ? (
                      <span className={styles.quiet}>{text["sagas.detail.never"]}</span>
                    ) : (
                      <q lang="en">{step.detail}</q>
                    )}
                  </dd>
                </dl>
                <div className={styles.returnBlock}>
                  <span className={styles.choiceLabel}>{text["sagas.steps.remedy"]}</span>
                  <pre className={styles.remedy} lang="en">
                    {step.remedy}
                  </pre>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </article>
  )
}

export { SagaView }
