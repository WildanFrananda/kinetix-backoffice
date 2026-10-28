import { useQuery } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { sessionQuery } from "../api/session_query"
import markDark from "../assets/kinetix-mark-dark.svg"
import markLight from "../assets/kinetix-mark-light.svg"
import { SignOutButton } from "../features/session/SignOutButton"
import { useText } from "../i18n/use_text"
import styles from "./AppFrame.module.css"
import { LocaleSwitch } from "./LocaleSwitch"
import { ThemeSwitch } from "./ThemeSwitch"

function AppFrame({ children }: { children: ReactNode }) {
  const text = useText()
  const session = useQuery(sessionQuery())
  return (
    <div className={styles.frame}>
      <header className={styles.bar}>
        <img className={`${styles.mark} ${styles.markDark}`} src={markDark} alt="" width={26} height={26} />
        <img className={styles.markLight} src={markLight} alt="" width={26} height={26} />
        <p className={styles.name}>Kinetix {text["app.name"]}</p>
        <div className={styles.tools}>
          <LocaleSwitch />
          <ThemeSwitch />
          {session.data?.authenticated === true ? <SignOutButton /> : null}
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  )
}

export { AppFrame }
