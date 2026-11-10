import { useEffect, useRef, useState } from "react"
import styles from "./Fleet.module.css"
import { pngBytes } from "./png_bytes"

function SignatureImage({ dataUri, label, unreadable }: { dataUri: string; label: string; unreadable: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [state, setState] = useState<"drawing" | "drawn" | "unreadable">("drawing")

  useEffect(() => {
    const bytes = pngBytes(dataUri)
    if (bytes === null || typeof createImageBitmap !== "function") {
      setState("unreadable")

      return
    }

    let cancelled = false

    createImageBitmap(new Blob([bytes], { type: "image/png" }))
      .then((bitmap) => {
        const target = canvas.current
        const context = target?.getContext("2d") ?? null

        if (cancelled || target === null || context === null) {
          bitmap.close()
          setState(cancelled ? "drawing" : "unreadable")

          return
        }

        target.width = bitmap.width
        target.height = bitmap.height
        context.drawImage(bitmap, 0, 0)
        bitmap.close()
        setState("drawn")
      })
      .catch(() => {
        if (!cancelled) {
          setState("unreadable")
        }
      })

    return () => {
      cancelled = true
    }
  }, [dataUri])

  if (state === "unreadable") {
    return <p className={styles.proofNone}>{unreadable}</p>
  }

  return <canvas ref={canvas} className={styles.signature} role="img" aria-label={label} data-state={state} />
}

export { SignatureImage }
