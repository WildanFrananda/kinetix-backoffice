import { ArrowClockwise } from "@phosphor-icons/react"
import { useQueryClient } from "@tanstack/react-query"
import { m } from "motion/react"
import { useLocale } from "../../i18n/use_locale"
import { useText } from "../../i18n/use_text"
import { Button } from "../../ui/Button"
import { enter, stagger } from "../../ui/motion/motion_presets"
import { PageHeader } from "../../ui/PageHeader"
import { PanelBoundary } from "../../ui/PanelBoundary"
import { usePresence } from "../../ui/use_presence"
import { ApprovalsPanel } from "./ApprovalsPanel"
import { AttentionPanel } from "./AttentionPanel"
import { DispatchPanel } from "./DispatchPanel"
import styles from "./Overview.module.css"
import { overviewKey } from "./overview_queries"
import { ReturnsPanel } from "./ReturnsPanel"

const grid = { hidden: {}, shown: { transition: { staggerChildren: stagger } } }

const cell = { hidden: { opacity: 0, y: 10 }, shown: { opacity: 1, y: 0, transition: enter } }

function OverviewPage() {
  const text = useText()
  const locale = useLocale()
  const queryClient = useQueryClient()
  const poll = usePresence()
  const today = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", year: "numeric" })

  return (
    <>
      <PageHeader
        eyebrow={`${text["nav.workspace"]} · ${today.format(new Date())}`}
        title={text["nav.overview"]}
        lead={poll ? text["overview.lead"] : text["overview.paused"]}
        actions={
          <Button variant="secondary" onPress={() => void queryClient.refetchQueries({ queryKey: overviewKey })}>
            <ArrowClockwise aria-hidden="true" />
            {text["overview.refreshAll"]}
          </Button>
        }
      />
      <m.div className={styles.grid} variants={grid} initial="hidden" animate="shown">
        <m.div className={styles.wide} variants={cell}>
          <PanelBoundary>
            <DispatchPanel poll={poll} />
          </PanelBoundary>
        </m.div>
        <m.div className={styles.narrow} variants={cell}>
          <PanelBoundary>
            <ApprovalsPanel poll={poll} />
          </PanelBoundary>
        </m.div>
        <m.div className={styles.broad} variants={cell}>
          <PanelBoundary>
            <AttentionPanel poll={poll} />
          </PanelBoundary>
        </m.div>
        <m.div className={styles.wide} variants={cell}>
          <PanelBoundary>
            <ReturnsPanel poll={poll} />
          </PanelBoundary>
        </m.div>
      </m.div>
    </>
  )
}

export { OverviewPage }
