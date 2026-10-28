import markDark from "../assets/kinetix-mark-dark.svg"
import markLight from "../assets/kinetix-mark-light.svg"
import styles from "./BrandMark.module.css"

function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <span className={styles.mark} style={{ width: size, height: size }}>
      <img className={styles.dark} src={markDark} alt="" width={size} height={size} />
      <img className={styles.light} src={markLight} alt="" width={size} height={size} />
    </span>
  )
}

export { BrandMark }
