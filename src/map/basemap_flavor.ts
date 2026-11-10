import type { Flavor } from "@protomaps/basemaps"
import type { MapTokens } from "../types/map_tokens.type"
import { mixColor } from "./color_mix"

function basemapFlavor(tokens: MapTokens): Flavor {
  function ink(share: number): string {
    return mixColor(tokens.paper, tokens.ink, share)
  }

  const water = mixColor(tokens.paper, tokens.water, 0.2)
  const greenLight = mixColor(tokens.paper, tokens.green, 0.1)
  const greenDeep = mixColor(tokens.paper, tokens.green, 0.16)
  const ground = ink(0.035)
  const minor = ink(0.16)
  const casing = tokens.paper

  return {
    background: water,
    earth: tokens.paper,
    park_a: greenLight,
    park_b: greenDeep,
    hospital: ground,
    industrial: ground,
    school: ground,
    wood_a: greenLight,
    wood_b: greenDeep,
    pedestrian: ground,
    scrub_a: greenLight,
    scrub_b: greenLight,
    glacier: ground,
    sand: ground,
    beach: ground,
    aerodrome: ground,
    runway: ink(0.14),
    water,
    zoo: greenLight,
    military: ground,
    tunnel_other_casing: casing,
    tunnel_minor_casing: casing,
    tunnel_link_casing: casing,
    tunnel_major_casing: casing,
    tunnel_highway_casing: casing,
    tunnel_other: ink(0.1),
    tunnel_minor: ink(0.1),
    tunnel_link: ink(0.12),
    tunnel_major: ink(0.14),
    tunnel_highway: ink(0.18),
    pier: ink(0.1),
    buildings: ink(0.08),
    minor_service_casing: casing,
    minor_casing: casing,
    link_casing: casing,
    major_casing_late: casing,
    highway_casing_late: casing,
    other: minor,
    minor_service: minor,
    minor_a: ink(0.18),
    minor_b: ink(0.2),
    link: ink(0.26),
    major_casing_early: casing,
    major: ink(0.3),
    highway_casing_early: casing,
    highway: ink(0.4),
    railway: ink(0.45),
    boundaries: ink(0.35),
    bridges_other_casing: ink(0.5),
    bridges_minor_casing: ink(0.5),
    bridges_link_casing: ink(0.5),
    bridges_major_casing: ink(0.5),
    bridges_highway_casing: ink(0.5),
    bridges_other: minor,
    bridges_minor: ink(0.2),
    bridges_link: ink(0.26),
    bridges_major: ink(0.3),
    bridges_highway: ink(0.4),
    roads_label_minor: tokens.faint,
    roads_label_minor_halo: tokens.paper,
    roads_label_major: tokens.muted,
    roads_label_major_halo: tokens.paper,
    ocean_label: mixColor(tokens.water, tokens.ink, 0.2),
    subplace_label: tokens.faint,
    subplace_label_halo: tokens.paper,
    city_label: tokens.muted,
    city_label_halo: tokens.paper,
    state_label: tokens.faint,
    state_label_halo: tokens.paper,
    country_label: tokens.faint,
    address_label: tokens.faint,
    address_label_halo: tokens.paper
  }
}

export { basemapFlavor }
