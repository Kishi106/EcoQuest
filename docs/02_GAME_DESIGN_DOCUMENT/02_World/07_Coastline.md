07_Coastline.md
markdown
# Coastline System Specification

## 1. Purpose

The Coastline System simulates every interaction between land and ocean/large water bodies: shoreline shape, erosion and accretion, tides, storm surge, sea-level rise, coastal ecosystems (beaches, dunes, coral reefs, mangroves), and human infrastructure (ports, harbors, seawalls, breakwaters). It sits between the Terrain System (which owns elevation/slope data) and the Water System (which owns ocean/tide data), acting as the authoritative boundary layer where the two interact.

## 2. Scope

- Shoreline geometry and classification (rocky, sandy, muddy, cliff, deltaic)
- Tidal zones and tidal range simulation
- Wave energy and longshore drift
- Coastal erosion and sediment accretion
- Sea-level rise (long-term climate-linked)
- Storm surge and coastal flooding (linked to Disasters System)
- Coastal ecosystems: beaches, dunes, mangroves, coral reefs, salt marshes
- Coastal defense infrastructure: seawalls, breakwaters, levees, living shorelines
- Port/harbor viability and dredging
- Coastal buildable-zone determination (feeds Buildings System)

## 3. Architecture

CoastlineSystem
├── ShorelineManager
│ ├── ShorelineSegment[] (polyline representation, ~10m resolution nodes)
│ ├── ClassificationEngine (rocky/sandy/muddy/cliff/deltaic)
│ └── GeometryUpdater (rewrites segments as erosion/accretion occurs)
├── TidalModule
│ ├── TideCycle (semi-diurnal, simplified sine-based)
│ ├── TidalZoneMapper (intertidal, subtidal, supratidal bands)
│ └── TidalRangeCalculator (influenced by regional bathymetry)
├── WaveEnergyModule
│ ├── WaveGenerator (wind-driven, reads Climate wind vectors)
│ ├── FetchCalculator (open-water distance to wave height)
│ └── LongshoreDriftEngine (sediment transport direction/rate)
├── ErosionAccretionEngine
│ ├── ErosionRateCalculator (per-segment, cm/year)
│ ├── AccretionRateCalculator (sediment deposition)
│ ├── SedimentBudget (source/sink ledger per coastal cell)
│ └── ShorelineRetreatProjector (visual + gameplay-affecting)
├── SeaLevelModule
│ ├── BaselineSeaLevel
│ ├── ClimateLinkedRiseCurve (reads Climate System climate-change variable)
│ └── InundationMapUpdater (recomputes floodable land per tick)
├── StormSurgeModule
│ ├── SurgeHeightCalculator (storm intensity to surge height)
│ ├── SurgeFloodPropagator (interfaces with Water System flooding)
│ └── DisasterHookInterface (registers with Disasters System)
├── CoastalEcosystemModule
│ ├── BeachDuneSubsystem
│ ├── MangroveSubsystem
│ ├── CoralReefSubsystem
│ └── SaltMarshSubsystem
├── CoastalDefenseModule
│ ├── SeawallEntity
│ ├── BreakwaterEntity
│ ├── LevyEntity
│ ├── LivingShorelineEntity (mangrove/marsh restoration as defense)
│ └── DefenseEffectivenessCalculator
└── PortHarborModule
├── DepthSuitabilityChecker (bathymetry vs. vessel draft)
├── DredgingManager
└── HarborViabilityScore


## 4. Core Data Structures

CoastlineSegment {
id: GUID
polyline: Vector2[] // node chain, ~10m spacing
classification: Enum {ROCKY, SANDY, MUDDY, CLIFF, DELTAIC}
elevation_profile: float[] // cross-shore elevation samples
slope_offshore: float // degrees, affects wave breaking
erosion_rate: float // cm/year, signed (+erosion / -accretion)
sediment_type: Enum {SAND, SILT, CLAY, GRAVEL, ROCK}
tidal_zone_width: float // meters
hazard_exposure: float // 0-1, computed from fetch + slope
defense_structures: DefenseEntity[]
ecosystem_coverage: {
beach_pct: float, dune_pct: float, mangrove_pct: float,
reef_pct: float, marsh_pct: float
}
}

TideState {
current_level: float // meters relative to mean sea level
cycle_phase: float // 0-1 within tidal cycle
tidal_range: float // regional, meters
next_high: Timestamp
next_low: Timestamp
}

SeaLevelState {
baseline_msl: float
current_msl: float
annual_rise_rate: float // mm/year, driven by Climate System
projected_msl_2050: float
projected_msl_2100: float
}

StormSurgeEvent {
disaster_id: GUID (ref: DisasterEvent)
peak_surge_height: float // meters above predicted tide
affected_segments: GUID[]
duration_hours: float
inland_penetration_m: float
}

CoastalDefense {
id: GUID
type: Enum {SEAWALL, BREAKWATER, LEVEE, LIVING_SHORELINE}
segment_id: GUID
height: float
design_surge_capacity: float // max surge height it withstands
degradation: float // 0-1, reduces with maintenance neglect
construction_cost: float
maintenance_cost_annual: float
ecological_penalty: float // hard defenses reduce nearby ecosystem health
}


## 5. Key Mechanics

### 5.1 Shoreline Erosion/Accretion

erosion_rate(segment) = base_rate(sediment_type)
x wave_energy_factor(fetch, wind_speed)
x (1 - vegetation_protection_factor)
x (1 - defense_effectiveness)
x sea_level_rise_multiplier


Net-negative sediment budget cells retreat (erosion); net-positive cells prograde (accretion, forms new beach/delta land). Retreat beyond a threshold removes buildable land and can undermine adjacent buildings (triggers Buildings System structural-risk flag).

### 5.2 Tides

Simplified semi-diurnal model: `tide_level(t) = amplitude x sin(2*pi*t / period) + msl_offset`. Amplitude varies by region (embayment vs. open coast). Intertidal zone (between low and high tide marks) is non-buildable but is prime habitat for mangroves/marshes and affects port scheduling (dredging windows, low-tide grounding risk).

### 5.3 Storm Surge

On Disasters System cyclone trigger, StormSurgeModule computes surge height from storm category plus regional bathymetry (shallow continental shelf amplifies surge), then propagates inland flooding via the Water System flood solver. Coastal defenses reduce effective surge height up to their `design_surge_capacity`; beyond that, they fail (partial or total) and stop contributing.

### 5.4 Sea-Level Rise

Long-horizon variable tied to the Climate System's climate-change index. Annually nudges `baseline_msl` upward, which permanently shrinks buildable elevation bands, raises the intertidal zone inland, and increases baseline flood risk, creating pressure to build defenses or relocate zones over a long campaign.

### 5.5 Coastal Ecosystems

- **Mangroves/Salt Marshes**: reduce erosion rate and surge height (soft defense), require brackish water and low wave energy to establish, provide wildlife habitat bonus (feeds Wildlife System) and carbon storage (feeds Environment System).
- **Coral Reefs**: exist only in warm, clear, low-pollution water (reads Water quality plus Climate temperature); dissipate wave energy before it reaches shore; sensitive to pollution and temperature (bleaching events).
- **Beaches/Dunes**: tourism value (feeds Economy System), natural buffer, degrade under high foot-traffic/development without maintenance.

### 5.6 Ports & Harbors

`HarborViability = f(water_depth, wave_shelter, distance_to_trade_routes, dredging_investment)`. Insufficient depth requires dredging (recurring cost, generates sediment disposal side-effects). Port throughput feeds the Economy System's trade/tourism revenue.

## 6. System Dependencies

| Reads From | Provides To |
|---|---|
| Terrain (elevation, bathymetry) | Buildings (buildable coastal zones) |
| Water (ocean level, currents, quality) | Wildlife (mangrove/reef habitat) |
| Climate (wind, temperature, climate-change index) | Environment (coastal ecosystem health) |
| Disasters (cyclone events) | Disasters (surge magnitude feedback) |
| - | Economy (tourism, port revenue) |

## 7. Edge Cases & Validation

- Segments with 0% defense and high hazard_exposure must flag as "high risk" in UI before allowing residential construction.
- Erosion cannot delete a segment entirely mid-game; it retreats and shrinks, never disappears, to avoid pathfinding/geometry breaks.
- Defense structures placed on eroding segments must recompute foundation validity if erosion undermines their base.
- Sea-level rise rate is clamped to prevent runaway inundation from making the map unplayable; designer-tunable cap in Balancing config.