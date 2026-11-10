import { useReducedMotion } from "motion/react"
import { useEffect, useRef, useState } from "react"
import { Button } from "react-aria-components"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import { BasemapUnreadable, readBasemapManifest } from "../../map/basemap_manifest"
import type { GeoPoint } from "../../types/geo_point.type"
import type { MapScene } from "../../types/map_scene.type"
import type { StreetMapHandle } from "../../types/street_map_handle.type"
import type { StreetMapState } from "../../types/street_map_state.type"
import { CornersOut } from "../icons/CornersOut"
import { Minus } from "../icons/Minus"
import { Plus } from "../icons/Plus"
import { supportsWebgl2 } from "../webgl2"
import { MapLegend } from "./MapLegend"
import { useMapText } from "./map_text"
import { PlaneMap } from "./PlaneMap"
import styles from "./StreetMap.module.css"

function loadPainter() {
  return import("../../map/street_map_painter")
}

function StreetMap({
  label,
  scene,
  frame,
  frameKey,
  onChoose
}: {
  label: string
  scene: MapScene
  frame: readonly GeoPoint[]
  frameKey: string
  onChoose: (id: string) => void
}) {
  const text = useMapText()
  const locale = useLocale()
  const reduced = useReducedMotion() === true
  const surface = useRef<HTMLDivElement>(null)
  const handle = useRef<StreetMapHandle | null>(null)
  const latest = useRef({ scene, frame, onChoose, locale, label, reduced })
  const [state, setState] = useState<StreetMapState>({ kind: "probing" })
  const [problem, setProblem] = useState(false)
  const framed = useRef<string | null>(null)

  latest.current = { scene, frame, onChoose, locale, label, reduced }

  useEffect(() => {
    const box = surface.current
    if (box === null) {
      return
    }

    if (!supportsWebgl2()) {
      setState({ kind: "plane", reason: "no-webgl" })

      return
    }

    const target = box
    const reading = new AbortController()
    let disposed = false

    async function mount(): Promise<void> {
      const manifest = await readBasemapManifest(reading.signal)

      if (disposed) {
        return
      }

      if (manifest === null) {
        setState({ kind: "plane", reason: "no-basemap" })

        return
      }

      const painter = await loadPainter()

      if (disposed) {
        return
      }

      const now = latest.current
      const mounted = painter.mountStreetMap(target, {
        label: now.label,
        basemap: manifest,
        locale: now.locale,
        scene: now.scene,
        reducedMotion: now.reduced,
        onChoose: (id) => latest.current.onChoose(id),
        onProblem: () => setProblem(true)
      })

      if (disposed) {
        mounted.dispose()

        return
      }

      handle.current = mounted
      mounted.frame(latest.current.frame)
      setState({ kind: "street", manifest })
    }

    mount().catch((error: unknown) => {
      if (disposed) {
        return
      }

      setState(
        error instanceof BasemapUnreadable
          ? { kind: "plane", reason: "unreadable", status: error.status }
          : { kind: "plane", reason: "failed" }
      )
    })

    return () => {
      disposed = true
      reading.abort()
      handle.current?.dispose()
      handle.current = null
    }
  }, [])

  useEffect(() => {
    handle.current?.show(scene)
  }, [scene])

  useEffect(() => {
    handle.current?.setLocale(locale)
  }, [locale])

  useEffect(() => {
    if (framed.current === frameKey) {
      return
    }

    framed.current = frameKey
    handle.current?.frame(latest.current.frame)
  })

  function caption() {
    if (state.kind === "street") {
      return (
        <>
          {text["map.attribution"]} · {formatText(text["map.build"], { date: state.manifest.build })}
          {problem ? <span className={styles.problem}> {text["map.problem"]}</span> : null}
        </>
      )
    }

    if (state.kind === "probing") {
      return text["map.loading"]
    }

    if (state.reason === "unreadable") {
      return formatText(text["map.plane.unreadable"], { status: String(state.status) })
    }

    const reasons = {
      "no-webgl": text["map.plane.noWebgl"],
      "no-basemap": text["map.plane.noBasemap"],
      failed: text["map.plane.failed"]
    } as const

    return reasons[state.reason]
  }

  const plane = state.kind === "plane"

  return (
    <figure className={styles.map} data-renderer={state.kind === "street" ? "webgl" : plane ? "svg" : "none"}>
      <div className={styles.frame}>
        <div ref={surface} className={styles.surface} data-hidden={plane} />
        {plane ? <PlaneMap label={label} scene={scene} /> : null}
        {state.kind === "street" ? (
          <div className={styles.controls}>
            <Button className={styles.control} aria-label={text["map.zoomIn"]} onPress={() => handle.current?.zoom(1)}>
              <Plus aria-hidden="true" />
            </Button>
            <Button
              className={styles.control}
              aria-label={text["map.zoomOut"]}
              onPress={() => handle.current?.zoom(-1)}
            >
              <Minus aria-hidden="true" />
            </Button>
            <Button
              className={styles.control}
              aria-label={text["map.frame"]}
              onPress={() => handle.current?.frame(latest.current.frame)}
            >
              <CornersOut aria-hidden="true" />
            </Button>
          </div>
        ) : null}
      </div>
      <figcaption className={styles.caption}>
        <MapLegend scene={scene} />
        <span className={styles.note} role={plane ? "note" : undefined}>
          {caption()}
        </span>
      </figcaption>
    </figure>
  )
}

export { StreetMap }
