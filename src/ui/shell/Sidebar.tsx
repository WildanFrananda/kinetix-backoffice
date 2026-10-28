import { Link } from "@tanstack/react-router"
import { useText } from "../../i18n/use_text"
import { BrandMark } from "../BrandMark"
import { AccountBlock } from "./AccountBlock"
import { LocaleToggle } from "./LocaleToggle"
import { navigation } from "./navigation"
import styles from "./Sidebar.module.css"
import { ThemeToggle } from "./ThemeToggle"

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const text = useText()

  return (
    <div className={styles.sidebar}>
      <Link to="/" className={styles.brand} onClick={onNavigate}>
        <BrandMark size={30} />
        <span className={styles.brandText}>
          <span className={styles.kicker}>Kinetix</span>
          <span className={styles.name}>{text["app.name"]}</span>
        </span>
      </Link>
      <nav aria-label={text["nav.label"]} className={styles.nav}>
        <p className={styles.section}>{text["nav.workspace"]}</p>
        <ul className={styles.links}>
          {navigation.map((item) => (
            <li key={item.to}>
              <Link to={item.to} activeOptions={{ exact: item.exact }} className={styles.link} onClick={onNavigate}>
                <item.icon aria-hidden="true" className={styles.icon} />
                <span>{text[item.label]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className={styles.preferences}>
        <LocaleToggle />
        <ThemeToggle />
      </div>
      <AccountBlock />
    </div>
  )
}

export { Sidebar }
