import { m, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react"
import type { PointerEvent } from "react"
import type { Account } from "../../types/account.type"
import { BrandMark } from "../../ui/BrandMark"
import { CopyValue } from "../../ui/CopyValue"
import { SealCheck } from "../../ui/icons/SealCheck"
import { settle } from "../../ui/motion/motion_presets"
import { useAccountText } from "./account_text"
import { guillochePaths, machineLines, monogram } from "./badge_lines"
import styles from "./IdentityCard.module.css"

const pattern = guillochePaths(400, 250, 14)

const arrival = {
  hidden: { opacity: 0, rotateX: 28, y: 32, scale: 0.94 },
  shown: { opacity: 1, rotateX: 0, y: 0, scale: 1, transition: { ...settle, delay: 0.08 } }
}

function IdentityCard({ account }: { account: Account | undefined }) {
  const text = useAccountText()
  const reduced = useReducedMotion()
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const tiltX = useSpring(useTransform(pointerY, [-0.5, 0.5], [8, -8]), settle)
  const tiltY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-11, 11]), settle)
  const lines = account === undefined ? null : machineLines(account)
  const role = account === undefined ? "…" : account.role === "admin" ? text["account.roleAdmin"] : account.role

  function follow(event: PointerEvent<HTMLDivElement>): void {
    if (reduced === true || event.pointerType !== "mouse") {
      return
    }

    const box = event.currentTarget.getBoundingClientRect()
    pointerX.set((event.clientX - box.left) / box.width - 0.5)
    pointerY.set((event.clientY - box.top) / box.height - 0.5)
  }

  function rest(): void {
    pointerX.set(0)
    pointerY.set(0)
  }

  return (
    <div className={styles.stage} onPointerMove={follow} onPointerLeave={rest}>
      <m.div className={styles.arrival} variants={arrival} initial="hidden" animate="shown">
        <m.div className={styles.card} style={{ rotateX: tiltX, rotateY: tiltY }}>
          <div className={styles.edge} aria-hidden="true" />
          <div className={styles.face}>
            <svg className={styles.pattern} viewBox="0 0 400 250" preserveAspectRatio="none" aria-hidden="true">
              {pattern.map((path) => (
                <path key={path} d={path} />
              ))}
            </svg>
            <span className={styles.slot} aria-hidden="true" />
            <header className={styles.head}>
              <BrandMark size={22} />
              <span className={styles.issuer}>{text["account.card.issuer"]}</span>
              <span className={styles.role}>
                <SealCheck aria-hidden="true" size={14} />
                {role}
              </span>
            </header>
            <div className={styles.body}>
              <span className={styles.monogram} aria-hidden="true">
                {account === undefined ? "" : monogram(account.email)}
              </span>
              <div className={styles.who}>
                <p className={styles.label}>{text["account.card.holder"]}</p>
                <h2 id="identity-title" className={styles.email}>
                  {account?.email ?? "…"}
                </h2>
                <dl className={styles.ids}>
                  <div>
                    <dt>{text["account.userId"]}</dt>
                    <dd>
                      {account === undefined ? (
                        "…"
                      ) : (
                        <CopyValue value={String(account.userId)} label={text["account.userId"]} />
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>{text["account.principal"]}</dt>
                    <dd>
                      {account === undefined ? (
                        "…"
                      ) : (
                        <CopyValue value={account.principalId} label={text["account.principal"]} />
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            <p className={styles.machine} aria-hidden="true">
              <span>{lines?.[0] ?? ""}</span>
              <span>{lines?.[1] ?? ""}</span>
            </p>
          </div>
        </m.div>
      </m.div>
    </div>
  )
}

export { IdentityCard }
