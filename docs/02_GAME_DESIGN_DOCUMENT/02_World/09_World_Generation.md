09_World_Generation.md
markdown
# World Generation Specification

## 1. Purpose

Defines the procedural pipeline that generates a playable EcoQuest map from a seed: terrain, water bodies, coastline, climate zones, soil, initial vegetation, and resource deposits, before any simulation systems begin ticking. Generation must be deterministic (same seed produces the same map) and must produce a map that passes playability validation.

## 2. Scope

- Seed management and determinism
- Generation pipeline stages and ordering
- Noise-based heightmap generation
- Hydrology derivation (rivers, lakes, drainage basins)
- Coastline derivation
- Climate zone assignment
- Soil and biome classification
- Resource deposit placement
- Region/district partitioning
- Playability validation and regeneration triggers

## 3. Determinism & Seeding

WorldSeed {
master_seed: uint64
derived_seeds: {
heightmap: uint64, // hash(master_seed, "heightmap")
hydrology: uint64, // hash(master_seed, "hydrology")
climate: uint64,
resources: uint64,
vegetation: uint64
}
}


Each subsystem uses a derived seed (via deterministic hashing of the master seed plus a namespace string) so subsystems can be regenerated independently without disturbing others, while the whole map remains fully reproducible from `master_seed` alone.

## 4. Generation Pipeline

Stages run strictly in order; each stage consumes the previous stage's output.
HeightmapGeneration
-> Perlin/Simplex fractal noise (multi-octave) -> raw elevation grid
-> Domain warping for organic mountain ranges/valleys
-> Normalize to configured elevation range (Terrain.md bounds)
TectonicPass (optional, for large maps)
-> Voronoi plate segmentation
-> Ridge/fault line elevation boosts along plate boundaries
-> Mountain range formation along convergent boundaries
HydrologyDerivation
-> Fill-and-flow algorithm (D8 or D-infinity flow direction) on heightmap
-> Identify drainage basins and watershed boundaries
-> Trace river paths from high-flow-accumulation cells downhill to sea/lake
-> Depression-filling for lake formation (local minima above sea level threshold)
-> Output: RiverNetwork, LakeBasins -> feeds Water System
CoastlineDerivation
-> Threshold heightmap at sea level -> raw land/sea mask
-> Smooth/simplify mask into ShorelineSegment polylines (Coastline.md)
-> Classify segments (rocky/sandy/muddy/cliff/deltaic) from local slope
plus adjacent river-mouth proximity (deltaic near river outlets)
-> Compute initial bathymetry for near-shore cells
ClimateZoneAssignment
-> Latitude-band base temperature (if map has a latitude axis) or
config-driven climate belts
-> Elevation-based temperature lapse rate adjustment
-> Prevailing wind pattern generation (affects Climate System windfields
and Coastline fetch calculation)
-> Rainfall gradient from windward/leeward plus distance-from-coast falloff
-> Output feeds Climate System initial state
SoilAndBiomeClassification
-> Soil type from parent geology (set in TectonicPass) plus hydrology
proximity plus climate
-> Biome assignment via Whittaker-style temperature/rainfall lookup
(desert, grassland, forest, wetland, etc.)
-> Initial forest coverage seeded in forest-biome cells (feeds Forests System)
ResourceDepositPlacement
-> Mineral/raw-material deposits weighted by geology type from TectonicPass
-> Freshwater aquifer placement under suitable soil/geology
(feeds Water System groundwater)
-> Fertile-soil agricultural zones flagged (feeds Economy/Resources)
RegionPartitioning
-> Voronoi or watershed-based partition into named Regions
(RegionBoundary, Map_Rules.md)
-> Assign starting-unlocked region(s) vs. locked expansion regions
-> Place heritage/protected sites (fixed, non-random within constraints)
SpawnAndValidation
-> Determine valid player starting location(s): requires freshwater access,
buildable flat land above threshold area, coastal or river access for
early economy
-> Run PlayabilityValidator (Section 6)
-> If validation fails, reseed affected stage only (not full regeneration)
and retry, up to N attempts

## 5. Data Handoff Contract

Each stage writes to a shared `WorldGenBuffer` and the next stage reads only from it; no stage reaches backward into an earlier stage's raw generator state. This keeps stages swappable/regenerable in isolation (e.g., regenerate climate without touching terrain).

WorldGenBuffer {
heightmap: float[][]
plate_map: PlateId[][] // optional
flow_accumulation: float[][]
river_network: RiverPath[]
lake_basins: LakeBasin[]
shoreline_segments: CoastlineSegment[]
temperature_map: float[][]
rainfall_map: float[][]
wind_field: Vector2[][]
soil_map: SoilType[][]
biome_map: BiomeType[][]
resource_deposits: ResourceDeposit[]
regions: RegionBoundary[]
spawn_candidates: Vector2[]
}


## 6. Playability Validation

Map generation fails validation (triggering targeted stage reseed) if any of the following occur:

- No valid spawn location has both freshwater access and a minimum configured buildable flat area
- Total buildable land (post Map_Rules constraints) falls below a minimum percentage of map area
- No coastline generated on a map configured to require ocean access
- A region is fully unreachable (isolated by unbuildable terrain/water with no connecting land bridge)
- Resource distribution leaves any starting region without at least one basic raw material

## 7. Difficulty & Scenario Presets

WorldGenPreset {
name: string // e.g. "Coastal Delta", "Mountain Valley", "Arid Basin"
heightmap_params: {octaves, persistence, ridge_bias}
sea_level: float
climate_belt_override: Enum?
resource_scarcity: float // 0-1, scales deposit density
starting_region_count: int
}


Presets are designer-authored parameter bundles layered on top of the seed-driven pipeline; same pipeline, different tuning, enabling curated scenarios (used by the Missions System for scripted campaigns) alongside fully random sandbox maps.

## 8. Performance Notes

- Heightmap and hydrology stages are the most expensive; both must support chunked/async generation for large maps to avoid blocking the main thread.
- RegionPartitioning and SpawnAndValidation must be cheap enough to re-run repeatedly during the reseed-retry loop (Section 4, Stage 9) without re-running Stages 1-3.