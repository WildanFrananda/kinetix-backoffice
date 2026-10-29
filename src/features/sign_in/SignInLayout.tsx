import type { ReactNode } from "react"
import { useText } from "../../i18n/use_text"
import { ShieldCheck } from "../../ui/icons/ShieldCheck"
import { DrawingFigure } from "./DrawingFigure"
import { SessionEndedFigure } from "./SessionEndedFigure"
import styles from "./SignInLayout.module.css"

function SignInLayout({ ended, children }: { ended: boolean; children: ReactNode }) {
  const text = useText()

  return (
    <div className={styles.layout}>
      <section className={styles.form}>
        <p className={styles.eyebrow}>
          <ShieldCheck aria-hidden="true" size={16} />
          {text["signIn.eyebrow"]}
        </p>
        {children}
      </section>
      {ended ? <SessionEndedFigure /> : <DrawingFigure />}
    </div>
  )
}

export { SignInLayout }
