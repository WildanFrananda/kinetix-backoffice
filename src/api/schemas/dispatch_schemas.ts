import * as v from "valibot"
import type { DispatchJob } from "../../types/dispatch_job.type"
import type { DispatchPage } from "../../types/dispatch_page.type"
import type { FleetCourier } from "../../types/fleet_courier.type"
import type { NearbyCourier } from "../../types/nearby_courier.type"
import { countSchema } from "./count_schema"
import { instantSchema } from "./instant_schema"

const idSchema = v.pipe(v.number(), v.integer(), v.minValue(1))

const latitudeSchema = v.pipe(v.number(), v.finite(), v.minValue(-90), v.maxValue(90))

const longitudeSchema = v.pipe(v.number(), v.finite(), v.minValue(-180), v.maxValue(180))

const pointSchema = v.object({ latitude: latitudeSchema, longitude: longitudeSchema })

const jobStatusSchema = v.picklist(["pending", "assigned", "picked_up", "delivered", "cancelled"])

const courierStatusSchema = v.picklist(["online", "busy", "offline"])

const proofSchema = v.pipe(
  v.object({
    photo_url: v.nullable(v.pipe(v.string(), v.url())),
    signature: v.nullable(v.string())
  }),
  v.transform((proof) => ({ photoUrl: proof.photo_url, signature: proof.signature }))
)

const jobFields = {
  id: idSchema,
  order_number: v.nullable(v.string()),
  awb_number: v.nullable(v.string()),
  status: jobStatusSchema,
  merchant_principal_id: v.nullable(v.string()),
  weight_kg: countSchema,
  driver_id: v.nullable(idSchema),
  pickup: pointSchema,
  dropoff: pointSchema,
  assigned_at: v.nullable(instantSchema),
  delivered_at: v.nullable(instantSchema),
  inserted_at: instantSchema
}

const jobSchema = v.pipe(
  v.object({ ...jobFields, proof_of_delivery: v.optional(proofSchema) }),
  v.transform(
    (job): DispatchJob => ({
      id: job.id,
      orderNumber: job.order_number,
      awbNumber: job.awb_number,
      status: job.status,
      merchantPrincipalId: job.merchant_principal_id,
      weightKg: job.weight_kg,
      courierId: job.driver_id,
      pickup: job.pickup,
      dropoff: job.dropoff,
      assignedAt: job.assigned_at,
      deliveredAt: job.delivered_at,
      insertedAt: job.inserted_at,
      proof: job.proof_of_delivery ?? null
    })
  )
)

const jobAnswerSchema = v.pipe(
  v.object({ data: jobSchema }),
  v.transform((answer) => answer.data)
)

const jobListSchema = v.pipe(
  v.object({ data: v.array(jobSchema) }),
  v.transform((answer) => answer.data)
)

const jobPageSchema = v.pipe(
  v.object({ data: v.array(jobSchema), next_cursor: v.nullable(idSchema) }),
  v.transform((answer): DispatchPage => ({ jobs: answer.data, nextCursor: answer.next_cursor }))
)

const courierFields = {
  id: idSchema,
  status: courierStatusSchema,
  coordinates: v.nullable(pointSchema),
  speed_kmh: v.nullable(v.pipe(v.number(), v.finite())),
  bearing_deg: v.nullable(v.pipe(v.number(), v.finite())),
  recorded_at: v.nullable(instantSchema),
  updated_at: v.nullable(instantSchema)
}

function courierOf(courier: v.InferOutput<v.ObjectSchema<typeof courierFields, undefined>>): FleetCourier {
  return {
    id: courier.id,
    status: courier.status,
    position: courier.coordinates,
    speedKmh: courier.speed_kmh,
    bearingDeg: courier.bearing_deg,
    recordedAt: courier.recorded_at,
    updatedAt: courier.updated_at
  }
}

const courierSchema = v.pipe(v.object(courierFields), v.transform(courierOf))

const courierAnswerSchema = v.pipe(
  v.object({ data: courierSchema }),
  v.transform((answer) => answer.data)
)

const courierListSchema = v.pipe(
  v.object({ data: v.array(courierSchema) }),
  v.transform((answer) => answer.data)
)

const nearbyCourierSchema = v.pipe(
  v.object({ ...courierFields, distance_km: v.pipe(v.number(), v.finite(), v.minValue(0)) }),
  v.transform((courier): NearbyCourier => ({ ...courierOf(courier), distanceKm: courier.distance_km }))
)

const nearbyListSchema = v.pipe(
  v.object({ data: v.array(nearbyCourierSchema) }),
  v.transform((answer) => answer.data)
)

export {
  courierAnswerSchema,
  courierListSchema,
  jobAnswerSchema,
  jobListSchema,
  jobPageSchema,
  jobStatusSchema,
  nearbyListSchema
}
