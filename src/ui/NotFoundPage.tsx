import { Link } from "@tanstack/react-router"
import { useText } from "../i18n/use_text"
import styles from "./NotFoundPage.module.css"

function NotFoundPage() {
  const text = useText()
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{text["notFound.title"]}</h1>
      <p className={styles.body}>{text["notFound.body"]}</p>
      <Link to="/">{text["notFound.home"]}</Link>
    </section>
  )
}

export { NotFoundPage }
