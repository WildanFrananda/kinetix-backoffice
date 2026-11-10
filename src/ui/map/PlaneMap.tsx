import { useEffect, useRef, useState } from "react"
import { formatDistance } from "../../i18n/format_distance"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import { planeView } from "../../map/plane_model"
import type { GridLine } from "../../types/grid_line.type"
import type { MapCatalogue } from "../../types/map_catalogue.type"
import type { MapScene } from "../../types/map_scene.type"
import { useMapText } from "./map_text"
import styles from "./StreetMap.module.css"

const defaultSize = { width: 640, height: 360 }

function decimalsOf(step: number): number {
  return Math.max(0, Math.ceil(-Math.log10(step)))
}

function gridLabel(line: GridLine, decimals: number, text: MapCatalogue, numbers: Intl.NumberFormat): string {
  const degrees = numbers.format(Number(Math.abs(line.degrees).toFixed(decimals)))

  if (line.axis === "latitude") {
    return formatText(text[line.degrees < 0 ? "map.plane.south" : "map.plane.north"], { degrees })
  }

  return formatText(text[line.degrees < 0 ? "map.plane.west" : "map.plane.east"], { degrees })
}

function PlaneMap({ label, scene }: { label: string; scene: MapScene }) {
  const text = useMapText()
  const locale = useLocale()
  const holder = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(defaultSize)

  useEffect(() => {
    const box = holder.current
    if (box === null || typeof ResizeObserver === "undefined") {
      return
    }

    const sizer = new ResizeObserver(([entry]) => {
      if (entry !== undefined && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        setSize({ width: Math.round(entry.contentRect.width), height: Math.round(entry.contentRect.height) })
      }
    })

    sizer.observe(box)

    return () => sizer.disconnect()
  }, [])

  const view = planeView(
    scene.places.map((place) => place.point),
    size.width,
    size.height
  )

  if (view === null) {
    return (
      <div ref={holder} className={styles.plane}>
        <p className={styles.planeEmpty}>{text["map.plane.empty"]}</p>
      </div>
    )
  }

  const steps = view.grid.length > 1 ? Math.abs((view.grid[1]?.degrees ?? 0) - (view.grid[0]?.degrees ?? 0)) : 1
  const decimals = decimalsOf(steps === 0 ? 1 : steps)
  const numbers = new Intl.NumberFormat(locale, { maximumFractionDigits: decimals, minimumFractionDigits: decimals })
  const ordered = [...scene.places].sort((a, b) => Number(a.selected) - Number(b.selected))
  const scaleLeft = 16
  const scaleBase = view.height - 16

  return (
    <div ref={holder} className={styles.plane}>
      <svg
        className={styles.planeSurface}
        role="img"
        aria-label={formatText(text["map.plane.label"], { label })}
        viewBox={`0 0 ${view.width} ${view.height}`}
        width={view.width}
        height={view.height}
      >
        {view.grid.map((line) =>
          line.axis === "longitude" ? (
            <g key={`lng-${line.degrees}`}>
              <line className={styles.gridLine} x1={line.at} x2={line.at} y1={0} y2={view.height} />
              <text className={styles.gridLabel} x={line.at + 4} y={14}>
                {gridLabel(line, decimals, text, numbers)}
              </text>
            </g>
          ) : (
            <g key={`lat-${line.degrees}`}>
              <line className={styles.gridLine} x1={0} x2={view.width} y1={line.at} y2={line.at} />
              <text className={styles.gridLabel} x={4} y={line.at - 4}>
                {gridLabel(line, decimals, text, numbers)}
              </text>
            </g>
          )
        )}
        {scene.routes.map((route) => {
          const from = view.project(route.from)
          const to = view.project(route.to)

          return (
            <line
              key={route.id}
              className={styles.route}
              data-selected={route.selected}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
            />
          )
        })}
        {ordered.map((place) => {
          const at = view.project(place.point)

          return (
            <g key={place.id} data-place={place.id}>
              <circle
                className={styles.place}
                data-kind={place.kind}
                data-tone={place.tone}
                data-selected={place.selected}
                cx={at.x}
                cy={at.y}
                r={place.selected ? 8 : place.kind === "courier" ? 6 : 7}
              />
              <text className={styles.placeLabel} x={at.x} y={at.y + 20}>
                {place.label}
              </text>
            </g>
          )
        })}
        <g>
          <rect
            className={styles.scaleBack}
            x={scaleLeft - 6}
            y={scaleBase - 22}
            width={view.scale.pixels + 12}
            height={30}
          />
          <line
            className={styles.scaleLine}
            x1={scaleLeft}
            x2={scaleLeft + view.scale.pixels}
            y1={scaleBase}
            y2={scaleBase}
          />
          <line className={styles.scaleLine} x1={scaleLeft} x2={scaleLeft} y1={scaleBase - 5} y2={scaleBase + 2} />
          <line
            className={styles.scaleLine}
            x1={scaleLeft + view.scale.pixels}
            x2={scaleLeft + view.scale.pixels}
            y1={scaleBase - 5}
            y2={scaleBase + 2}
          />
          <text className={styles.scaleLabel} x={scaleLeft} y={scaleBase - 9}>
            {formatDistance(view.scale.kilometres, locale)}
          </text>
        </g>
      </svg>
    </div>
  )
}

export { PlaneMap }
