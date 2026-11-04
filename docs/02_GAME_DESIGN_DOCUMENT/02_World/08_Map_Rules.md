08_Map_Rules.md
markdown
# Map Rules Specification

## 1. Purpose

Defines the invariant rules governing map structure, zoning legality, region boundaries, and cross-system spatial constraints. This is the rulebook other systems (Buildings, Terrain, Water, Coastline) query before allowing any spatial action; it does not simulate anything itself, it governs.

## 2. Scope

- Grid/coordinate system definition
- Region and district boundary rules
- Buildable vs. non-buildable zone determination
- Zoning categories and legal adjacency rules
- Slope, elevation, and flood-risk build constraints
- Protected/reserved land (parks, heritage, conservation)
- Ownership and territory expansion rules
- Cross-system conflict resolution order

## 3. Coordinate & Grid System

MapGrid {
cell_size_m: 10 // real-world meters per grid cell
map_dimensions: {width_cells, height_cells}
origin: Vector2 (0,0 = southwest corner)
coordinate_system: "cell-based, integer indexed"
}

RegionBoundary {
region_id: GUID
polygon: Vector2[] // closed polygon in cell-space
neighbors: GUID[]
boundary_type: Enum {NATURAL, ADMINISTRATIVE, PLAYER_DEFINED}
}


All systems reference the same grid; a cell is the atomic unit of spatial queries (`GetCellData(x, y)` returns merged Terrain + Water + Coastline + Zoning state).

## 4. Buildability Rules

A cell is buildable only if ALL of the following pass:

is_buildable(cell) =
terrain.slope <= max_slope_for_zone_type
AND terrain.elevation > current_flood_threshold
AND NOT cell.is_water
AND NOT cell.is_protected
AND coastline.tidal_zone == false // intertidal land excluded
AND cell.ownership == player_owned
AND cell.zoning_type != RESERVED


Zone-specific slope caps (tunable in Balancing.md):

- Residential/Commercial: <= 15 degrees
- Industrial: <= 10 degrees (heavy equipment)
- Roads: <= 25 degrees (with terracing above 12 degrees)
- Parks/Green space: <= 35 degrees
- Renewable energy (wind): requires open exposure, slope <= 20 degrees

## 5. Zoning Categories

| Zone Type | Adjacency Rules |
|---|---|
| Residential | Cannot be adjacent to Heavy Industrial (happiness penalty if within N cells) |
| Commercial | Benefits from Residential adjacency (foot traffic bonus) |
| Industrial | Requires road + resource access; pollution radius affects neighboring zones |
| Public Services | No hard adjacency restriction; effectiveness radius-based |
| Protected/Conservation | No construction permitted; overrides all other zoning |
| Agricultural | Requires soil quality above threshold (from Terrain soil data) plus water access |
| Coastal/Port | Requires Coastline harbor viability check |

Zoning changes are validated through a single `ZoningValidator` service that all UI/build actions must call, preventing systems from independently green-lighting conflicting construction.

## 6. Protected & Reserved Land

- **Conservation zones**: player- or mission-designated; locked from development; boosts Wildlife/Environment scores.
- **Heritage/cultural sites**: fixed at world-generation time, cannot be rezoned, provide tourism bonus (Economy).
- **Buffer zones**: auto-generated strips around wetlands, riverbanks, and coastline (configurable width, default 30m), non-buildable to protect ecosystem function, can be reduced only via specific tech/policy unlocks (ties into Missions System).

## 7. Territory & Expansion Rules

TerritoryExpansion {
unlocked_regions: GUID[]
expansion_cost: f(region.size, region.resource_value, region.difficulty)
prerequisite: Enum {POPULATION_THRESHOLD, BUDGET_THRESHOLD, MISSION_COMPLETE}
}


Regions are locked until unlocked via population/budget/mission gates (defined per-map in World_Generation). Expanding territory re-runs buildability computation for newly acquired cells only (not a full map recompute, for performance).

## 8. Conflict Resolution Order

When multiple systems flag a cell simultaneously (e.g., Coastline erosion undermining a Buildings-System structure while Disasters flags flood risk), rules resolve in this precedence:

1. Safety/legal constraints (protected land, flood threshold) - always win
2. Active disaster state (temporary override)
3. Terrain/Coastline physical constraints (slope, tidal zone)
4. Zoning rules
5. Player intent (manual override), only where permitted by 1-3

## 9. Validation & Query API

GetCellData(x, y) -> merged read-only cell state
IsBuildable(x, y, zone_type) -> bool + reason_if_false
ValidateZoningChange(region, new_zone) -> bool + conflict_list
GetBufferZones(water_feature_id) -> polygon[]


All build/zoning UI actions must route through `ValidateZoningChange` / `IsBuildable`; no system is permitted to write zoning state directly.