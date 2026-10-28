import type { ReactNode } from "react"
import { useText } from "../i18n/use_text"
import { BrandMark } from "./BrandMark"
import styles from "./PublicFrame.module.css"
import { LocaleToggle } from "./shell/LocaleToggle"
import { ThemeToggle } from "./shell/ThemeToggle"

function PublicFrame({ children }: { children: ReactNode }) {
  const text = useText()

  return (
    <div className={styles.frame}>
      <header className={styles.bar}>
        <BrandMark size={28} />
        <p className={styles.name}>
          <span className={styles.kicker}>Kinetix</span> {text["app.name"]}
        </p>
        <div className={styles.tools}>
          <LocaleToggle />
          <ThemeToggle />
        </div>
      </header>
      <main id="main" className={styles.main}>
        {children}
      </main>
    </div>
  )
}

export { PublicFrame }
