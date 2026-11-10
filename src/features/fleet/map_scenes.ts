import type { DispatchJob } from "../../types/dispatch_job.type"
import type { FleetCourier } from "../../types/fleet_courier.type"
import type { GeoPoint } from "../../types/geo_point.type"
import type { MapPlace } from "../../types/map_place.type"
import type { MapScene } from "../../types/map_scene.type"
import type { SceneLabels } from "../../types/scene_labels.type"

function courierPlace(courier: FleetCourier, selected: boolean): MapPlace | null {
  if (courier.position === null) {
    return null
  }

  return {
    id: `courier-${courier.id}`,
    kind: "courier",
    tone: courier.status,
    point: courier.position,
    label: String(courier.id),
    selected
  }
}

function jobPlaces(job: DispatchJob, labels: SceneLabels, numbered: boolean): MapPlace[] {
  const suffix = numbered ? ` ${job.id}` : ""

  return [
    {
      id: `pickup-${job.id}`,
      kind: "pickup",
      tone: "job",
      point: job.pickup,
      label: `${labels.pickup}${suffix}`,
      selected: false
    },
    {
      id: `dropoff-${job.id}`,
      kind: "dropoff",
      tone: "job",
      point: job.dropoff,
      label: `${labels.dropoff}${suffix}`,
      selected: false
    }
  ]
}

function present<Value>(value: Value | null): value is Value {
  return value !== null
}

function jobScene(
  job: DispatchJob,
  holder: FleetCourier | null,
  nearby: readonly FleetCourier[],
  labels: SceneLabels
): MapScene {
  const others = nearby.filter((courier) => courier.id !== holder?.id)
  const couriers = [
    ...others.map((courier) => courierPlace(courier, false)),
    holder === null ? null : courierPlace(holder, true)
  ].filter(present)

  return {
    places: [...jobPlaces(job, labels, false), ...couriers],
    routes: [{ id: `job-${job.id}`, from: job.pickup, to: job.dropoff, selected: true }]
  }
}

function fleetScene(
  couriers: readonly FleetCourier[],
  selected: number | null,
  jobs: readonly DispatchJob[],
  labels: SceneLabels
): MapScene {
  return {
    places: [
      ...jobs.flatMap((job) => jobPlaces(job, labels, jobs.length > 1)),
      ...couriers.map((courier) => courierPlace(courier, courier.id === selected)).filter(present)
    ],
    routes: jobs.map((job) => ({ id: `job-${job.id}`, from: job.pickup, to: job.dropoff, selected: false }))
  }
}

function jobFrame(job: DispatchJob, holder: FleetCourier | null): GeoPoint[] {
  return [job.pickup, job.dropoff, ...(holder?.position === null || holder === null ? [] : [holder.position])]
}

function fleetFrame(
  couriers: readonly FleetCourier[],
  selected: FleetCourier | null,
  jobs: readonly DispatchJob[]
): GeoPoint[] {
  if (selected === null) {
    return couriers.flatMap((courier) => (courier.position === null ? [] : [courier.position]))
  }

  return [
    ...(selected.position === null ? [] : [selected.position]),
    ...jobs.flatMap((job) => [job.pickup, job.dropoff])
  ]
}

function chosenId(placeId: string): { kind: "courier" | "job"; id: number } | null {
  const match = /^(courier|pickup|dropoff)-(\d+)$/.exec(placeId)
  if (match === null) {
    return null
  }

  return { kind: match[1] === "courier" ? "courier" : "job", id: Number(match[2]) }
}

export { chosenId, fleetFrame, fleetScene, jobFrame, jobScene }
