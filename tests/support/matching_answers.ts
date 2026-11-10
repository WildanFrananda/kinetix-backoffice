const traceId = "6f1c2b9e-3d4a-4f5e-8a7b-9c0d1e2f3a4b"

type Job = {
  id: number
  order_number: string | null
  awb_number: string | null
  status: string
  merchant_principal_id: string | null
  weight_kg: number
  driver_id: number | null
  pickup: { latitude: number; longitude: number }
  dropoff: { latitude: number; longitude: number }
  assigned_at: string | null
  delivered_at: string | null
  inserted_at: string
  proof_of_delivery?: { photo_url: string | null; signature: string | null }
}

const pendingJob: Job = {
  id: 4813,
  order_number: "ORD-20261022-7F3A91C2",
  awb_number: "KNX-20261022-MFRGGZDFMZTWQ",
  status: "pending",
  merchant_principal_id: "27f2d4c2-9519-4e8a-9857-355a0c066349",
  weight_kg: 2,
  driver_id: null,
  pickup: { latitude: -6.1754, longitude: 106.8272 },
  dropoff: { latitude: -6.2297, longitude: 106.8295 },
  assigned_at: null,
  delivered_at: null,
  inserted_at: "2026-10-22T03:15:01.902114Z"
}

const deliveredJob: Job = {
  id: 4812,
  order_number: "ORD-20261022-1B8E04D7",
  awb_number: "KNX-20261022-NBSWY3DPEB3W6",
  status: "delivered",
  merchant_principal_id: "74183bec-5cd4-4e1b-ad14-11975e537dd6",
  weight_kg: 1,
  driver_id: 21,
  pickup: { latitude: -6.1862, longitude: 106.834 },
  dropoff: { latitude: -6.2615, longitude: 106.781 },
  assigned_at: "2026-10-22T02:31:40.551208Z",
  delivered_at: "2026-10-22T03:04:12.310577Z",
  inserted_at: "2026-10-22T02:31:39.874006Z"
}

const unboundJob: Job = {
  id: 3920,
  order_number: null,
  awb_number: null,
  status: "pending",
  merchant_principal_id: null,
  weight_kg: 5,
  driver_id: null,
  pickup: { latitude: -6.2006, longitude: 106.7862 },
  dropoff: { latitude: -6.2441, longitude: 106.8007 },
  assigned_at: null,
  delivered_at: null,
  inserted_at: "2026-09-08T04:20:15.003871Z"
}

const busyCourier = {
  id: 17,
  status: "busy",
  coordinates: { latitude: -6.1801, longitude: 106.8295 },
  speed_kmh: 24.5,
  bearing_deg: 87.5,
  recorded_at: "2026-10-22T03:14:58.000000Z",
  updated_at: "2026-10-22T03:15:00.412311Z"
}

const idleCourier = {
  id: 21,
  status: "online",
  coordinates: { latitude: -6.1689, longitude: 106.8203 },
  speed_kmh: null,
  bearing_deg: null,
  recorded_at: "2026-10-22T03:14:41.000000Z",
  updated_at: "2026-10-22T03:14:41.230954Z"
}

const unplacedCourier = {
  id: 9,
  status: "offline",
  coordinates: null,
  speed_kmh: null,
  bearing_deg: null,
  recorded_at: null,
  updated_at: "2026-10-22T02:58:07.664120Z"
}

const photoUrl =
  "https://storage.example.com/example-bucket/pod/4812/photo.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=900"

const signature =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

function withProof(job: Job, proof = { photo_url: null as string | null, signature: null as string | null }) {
  return { ...job, proof_of_delivery: proof }
}

function refusal(status: number, error: string) {
  return () => Response.json({ error }, { status })
}

function phoenixFailure(status: number, detail: string) {
  return () => Response.json({ errors: { detail }, traceId }, { status })
}

export type { Job }
export {
  busyCourier,
  deliveredJob,
  idleCourier,
  pendingJob,
  phoenixFailure,
  photoUrl,
  refusal,
  signature,
  unboundJob,
  unplacedCourier,
  withProof
}
