import styles from "./Keycap.module.css"

function Keycap({ children }: { children: string }) {
  return <kbd className={styles.key}>{children}</kbd>
}

export { Keycap }
