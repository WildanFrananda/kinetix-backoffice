import { ShieldCheck } from "@phosphor-icons/react"
import type { ReactNode } from "react"
import { useText } from "../../i18n/use_text"
import { DrawingFigure } from "./DrawingFigure"
import styles from "./SignInLayout.module.css"

function SignInLayout({ children }: { children: ReactNode }) {
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
      <DrawingFigure />
    </div>
  )
}

export { SignInLayout }
