import type { MapPlace } from "../../types/map_place.type"
import type { MapScene } from "../../types/map_scene.type"
import { useMapText } from "./map_text"
import styles from "./StreetMap.module.css"

type LegendEntry = {
  key: "online" | "busy" | "offline" | "pickup" | "dropoff"
  kind: MapPlace["kind"]
  tone: MapPlace["tone"]
}

const entries: readonly LegendEntry[] = [
  { key: "online", kind: "courier", tone: "online" },
  { key: "busy", kind: "courier", tone: "busy" },
  { key: "offline", kind: "courier", tone: "offline" },
  { key: "pickup", kind: "pickup", tone: "job" },
  { key: "dropoff", kind: "dropoff", tone: "job" }
]

function MapLegend({ scene }: { scene: MapScene }) {
  const text = useMapText()
  const shown = entries.filter((entry) =>
    scene.places.some((place) => place.kind === entry.kind && place.tone === entry.tone)
  )

  if (shown.length === 0) {
    return null
  }

  return (
    <ul className={styles.legend} aria-label={text["map.legend.label"]}>
      {shown.map((entry) => (
        <li key={entry.key} className={styles.legendItem}>
          <svg className={styles.legendMark} viewBox="0 0 16 16" aria-hidden="true">
            <circle className={styles.place} data-kind={entry.kind} data-tone={entry.tone} cx={8} cy={8} r={5} />
          </svg>
          {text[`map.legend.${entry.key}`]}
        </li>
      ))}
      {scene.places.some((place) => place.selected) ? (
        <li className={styles.legendItem}>
          <svg className={styles.legendMark} viewBox="0 0 16 16" aria-hidden="true">
            <circle
              className={styles.place}
              data-kind="courier"
              data-tone="online"
              data-selected="true"
              cx={8}
              cy={8}
              r={5}
            />
          </svg>
          {text["map.legend.chosen"]}
        </li>
      ) : null}
    </ul>
  )
}

export { MapLegend }
