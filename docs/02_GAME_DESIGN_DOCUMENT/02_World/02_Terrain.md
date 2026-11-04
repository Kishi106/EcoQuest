# Terrain System Specification

**Document ID:** WORLD-002

**Module:** Terrain System

**Version:** 1.0

**Status:** Approved

**Priority:** Critical

---

# 1. Purpose

The Terrain System defines the physical shape of the world.

It is responsible for representing elevation, slopes, geological formations, soil characteristics, construction suitability, erosion, and land modification.

Every natural process within EcoQuest depends on terrain.

Terrain influences:

- Water Flow
- Forest Growth
- Agriculture
- Construction
- Wildlife
- Pollution
- Climate
- Natural Disasters
- Tourism
- Citizen Expansion

Without terrain, no other environmental system can function.

---

# 2. Scope

The Terrain System manages:

✓ Elevation

✓ Slopes

✓ Soil

✓ Rock Layers

✓ Terrain Modification

✓ Land Stability

✓ Erosion

✓ Buildability

✓ Geological Constraints

The following systems are NOT managed here:

- Rivers (WORLD-003)
- Forests (WORLD-004)
- Climate (WORLD-005)
- Wildlife (WORLD-006)
- Buildings (WORLD-008)

These systems consume terrain data but do not own it.

---

# 3. Design Philosophy

The terrain is not a static background.

It behaves as a living geological system.

Players may reshape terrain, but every modification changes how nature behaves.

Terrain should reward planning rather than unrestricted construction.

Environmental realism takes priority over player convenience.

---

# 4. Terrain Layers

Every terrain tile contains multiple independent data layers.

---

## Layer 1 — Elevation

Stores the absolute height above sea level.

Unit

Meters

Example

12 m

135 m

420 m

---

## Layer 2 — Slope

Stores terrain steepness.

Range

0°

to

90°

Influences

Construction Cost

Vehicle Access

Water Flow

Landslides

Erosion

---

## Layer 3 — Soil

Stores soil properties.

Examples

Sand

Clay

Silt

Loam

Rock

Each soil behaves differently.

---

## Layer 4 — Bedrock

Represents underground geological structure.

Examples

Khondalite

Granite

Laterite

Bedrock determines:

Construction difficulty

Tunnel feasibility

Landslide resistance

Excavation cost

---

## Layer 5 — Stability

Represents how stable the terrain currently is.

Affected by:

Rainfall

Vegetation

Slope

Excavation

Construction

Earthworks

---

# 5. Terrain Tile

Every tile contains the following information.

Terrain ID

Coordinates

Elevation

Slope

Aspect

Soil Type

Rock Type

Moisture

Stability

Vegetation Cover

Buildability Score

Flood Risk

Landslide Risk

Heat Retention

Surface Temperature

Each value updates independently.

---

# 6. Elevation System

Elevation defines the physical height of land.

Elevation influences:

Water

Climate

Temperature

Construction

Tourism

Wind

Vegetation

Wildlife

---

## Elevation Classes

| Class | Height |
|---------|----------|
| Sea Level | 0 m |
| Coastal Plain | 1–20 m |
| Lowland | 20–80 m |
| Highland | 80–250 m |
| Mountain | 250 m+ |

These values may be adjusted for gameplay balancing while preserving realism.

---

# 7. Slope System

Slope measures terrain inclination.

Categories

| Category | Angle |
|----------|---------|
| Flat | 0–5° |
| Gentle | 5–15° |
| Moderate | 15–30° |
| Steep | 30–45° |
| Extreme | 45°+ |

Slope directly affects:

Construction

Drainage

Flooding

Erosion

Landslides

Tree Growth

Road Placement

---

# 8. Aspect

Aspect represents the direction a slope faces.

Possible Values

North

South

East

West

North-East

North-West

South-East

South-West

Aspect influences:

Sunlight

Temperature

Evaporation

Vegetation

Solar Power Efficiency

---

# 9. Terrain Categories

Every tile belongs to one terrain category.

TERRAIN-001

Coastal Sand

TERRAIN-002

Grassland

TERRAIN-003

Agricultural Plain

TERRAIN-004

Rocky Hills

TERRAIN-005

Mountain Forest

TERRAIN-006

Wetland

TERRAIN-007

Urban Ground

TERRAIN-008

Industrial Ground

Each category provides default values for simulation.

---

# 10. Terrain Generation

EcoQuest uses a handcrafted world based on Visakhapatnam.

Terrain is not procedurally generated.

The map preserves:

- Major hills
- Beaches
- Valleys
- River basins
- Coastal plains
- Forests

Future versions may support procedural terrain generation.

---

# 11. Terrain Simulation Principles

Terrain follows these principles.

Principle 1

Gravity influences all water movement.

---

Principle 2

Steeper land erodes faster.

---

Principle 3

Vegetation increases stability.

---

Principle 4

Construction alters geology.

---

Principle 5

Nature attempts to restore balance over time.

---

# 12. Developer Notes

Terrain is the lowest-level environmental system.

Every other environmental simulation references terrain data.

Terrain values should never be modified directly by unrelated systems.

All modifications must pass through the Terrain Engine to preserve consistency.

---

# Improvements Introduced in Version 1.0

✓ Defined terrain architecture.

✓ Introduced layered terrain model.

✓ Added elevation classes.

✓ Added slope system.

✓ Added terrain categories.

✓ Introduced terrain tile specification.

✓ Defined geological philosophy.

✓ Prepared system for future terrain deformation.

---

# 13. Soil System

The Soil System represents the uppermost layer of terrain that supports vegetation, agriculture, groundwater recharge, and construction.

Every terrain tile stores a soil type.

Soil properties influence:

- Agriculture
- Tree Growth
- Water Retention
- Groundwater Recharge
- Construction Cost
- Erosion Resistance
- Pollution Absorption

---

## Soil Types

### SOIL-001

Sand

Characteristics

- Very High Drainage
- Low Nutrient Retention
- Low Fertility
- Easy Excavation

Advantages

- Fast construction
- Good groundwater recharge

Disadvantages

- Poor farming
- Easily eroded

Typical Locations

- Beaches
- Coastal Areas

---

### SOIL-002

Clay

Characteristics

- High Water Retention
- Low Drainage
- Moderate Fertility

Advantages

- Good crop support

Disadvantages

- Flood prone
- Difficult construction

Typical Locations

- River Basins

---

### SOIL-003

Silt

Characteristics

- Rich nutrients
- Moderate drainage
- High fertility

Advantages

Excellent Agriculture

Disadvantages

High erosion risk during floods.

---

### SOIL-004

Loam

Characteristics

Balanced mixture of:

- Sand
- Clay
- Silt

Advantages

- Best farming soil
- Stable
- Good drainage

Disadvantages

Higher land value.

---

### SOIL-005

Rock Surface

Characteristics

Almost no topsoil.

Advantages

Stable foundation.

Disadvantages

Cannot support farming.

Requires excavation.

---

# 14. Soil Properties

Each soil tile stores the following values.

| Property | Range |
|----------|--------|
| Fertility | 0–100 |
| Moisture | 0–100 |
| Organic Matter | 0–100 |
| Drainage | 0–100 |
| Compaction | 0–100 |
| Pollution | 0–100 |
| pH | 0–14 |
| Stability | 0–100 |

These values continuously update throughout gameplay.

---

# 15. Soil Fertility

Fertility determines crop productivity.

Influenced by:

- Rainfall
- Organic Matter
- Pollution
- Farming Practices
- Forest Cover
- Flooding

Poor farming slowly reduces fertility.

Sustainable farming restores fertility.

---

# 16. Rock System

Rock layers determine underground stability.

Rock type cannot normally change.

---

## ROCK-001

Khondalite

Properties

- Extremely Hard
- Stable
- Expensive Excavation

Typical Location

Eastern Ghats.

---

## ROCK-002

Granite

Properties

- Hard
- Stable
- Excellent Building Foundation

---

## ROCK-003

Laterite

Properties

- Moderate Hardness
- Weathered Surface

Construction Cost

Medium

---

## ROCK-004

Sedimentary Deposits

Properties

- Soft

Construction

Easy

Landslide Risk

Higher

---

# 17. Rock Properties

Each rock layer stores:

Hardness

Excavation Cost

Tunnel Suitability

Slope Stability

Weathering Resistance

Foundation Strength

These properties rarely change.

---

# 18. Construction Difficulty

Construction depends on multiple terrain variables.

Construction Difficulty =

Terrain

+

Slope

+

Rock Hardness

+

Groundwater

+

Vegetation

+

Environmental Regulations

Every tile calculates a Build Cost Modifier.

---

## Difficulty Ratings

| Rating | Description |
|---------|-------------|
| Very Easy | Minimal preparation |
| Easy | Minor preparation |
| Moderate | Standard engineering |
| Hard | Significant engineering |
| Extreme | Major engineering project |

---

# 19. Excavation

Players may excavate land.

Excavation removes soil before reaching bedrock.

Possible purposes:

- Construction
- Artificial Lakes
- Mining (Future)
- Terrain Flattening

Excavation requires:

Money

Time

Heavy Equipment

Excavation permanently alters terrain.

---

# 20. Terrain Deformation

Players may reshape terrain.

Allowed

✓ Flatten Hills

✓ Level Land

✓ Dig Lakes

✓ Create Terraces

✓ Build Embankments

✓ Restore Land

Not Allowed

✗ Raise Mountains

✗ Create Volcanoes

✗ Remove Ocean

Terrain modification should always follow realistic engineering limitations.

---

# 21. Artificial Lakes

Players may create lakes.

Requirements

Suitable depression.

Nearby water source.

Rainfall.

Groundwater.

Without water supply:

Artificial lakes gradually dry.

Overflow follows natural drainage.

Artificial lakes improve:

- Biodiversity
- Tourism
- Groundwater
- Temperature

---

# 22. Fill Material

Excavated soil becomes fill material.

Players may reuse fill to:

- Level terrain
- Build embankments
- Raise construction sites slightly
- Reduce flood risk

Fill material cannot create mountains.

Maximum fill height is limited by engineering constraints.

---

# 23. Retaining Walls

Retaining walls stabilize steep slopes.

Benefits

- Reduce Landslides

- Enable Construction

- Prevent Soil Collapse

Costs

High Construction Cost

Maintenance Required

Visual Impact

Poorly maintained retaining walls may fail during extreme rainfall.

---

# 24. Groundwater Interaction

Terrain influences groundwater.

Water infiltrates based on:

Soil Type

Slope

Vegetation

Rainfall

Impermeable surfaces reduce recharge.

Healthy forests significantly improve groundwater replenishment.

---

# 25. Terrain Balancing

Terrain should create meaningful decisions.

Flat land

↓

Easy Construction

↓

High Urban Expansion

Steep Hills

↓

Expensive Construction

↓

Environmental Benefits

Players should constantly balance development with conservation.

---

# Improvements Introduced in Version 1.1

✓ Added complete soil simulation.

✓ Added soil properties.

✓ Introduced fertility mechanics.

✓ Added geological rock system.

✓ Added excavation rules.

✓ Added terrain deformation.

✓ Introduced artificial lakes.

✓ Added fill material system.

✓ Added retaining walls.

✓ Connected terrain with groundwater simulation.

---

# 26. Erosion System

The Erosion System simulates the gradual movement of soil and rock caused by natural forces.

Erosion continuously reshapes the terrain throughout the game.

It cannot be completely prevented, only managed.

---

## Sources of Erosion

Natural erosion occurs due to:

• Rainfall

• Rivers

• Wind

• Ocean Waves

• Gravity

Human activities accelerate erosion.

Examples

- Deforestation
- Excavation
- Overgrazing
- Poor Farming Practices
- Excessive Construction

---

## Erosion Types

### EROSION-001

Surface Erosion

Occurs during rainfall.

Removes the upper fertile soil layer.

Most common form of erosion.

---

### EROSION-002

Riverbank Erosion

Occurs along rivers.

High water flow gradually removes riverbanks.

Can reduce nearby farmland.

---

### EROSION-003

Coastal Erosion

Occurs along beaches.

Storms and waves slowly reshape coastlines.

Sea walls reduce erosion but increase construction costs.

---

### EROSION-004

Wind Erosion

Occurs in dry open areas.

Removes loose topsoil.

Reduced by vegetation.

---

# 27. Erosion Variables

Each terrain tile stores:

| Variable | Range |
|----------|--------|
| Soil Loss | 0–100 |
| Sediment Load | 0–100 |
| Vegetation Cover | 0–100 |
| Rain Exposure | 0–100 |
| Wind Exposure | 0–100 |
| Water Flow Strength | 0–100 |

These values are recalculated periodically.

---

# 28. Sediment Transport

Eroded soil does not disappear.

Sediment is transported by:

• Rivers

• Floodwater

• Gravity

Sediment may:

- Improve downstream farmland.
- Fill lakes.
- Reduce reservoir capacity.
- Alter river channels.
- Increase flood risk.

---

# 29. Landslide System

Steep unstable terrain may collapse.

A landslide occurs when:

Slope is steep

+

Heavy rainfall

+

Low vegetation

+

Low stability

=

High Landslide Risk

---

## Landslide Effects

• Destroy vegetation

• Damage nearby buildings

• Block rivers

• Increase sediment

• Reduce buildability

• Lower citizen happiness

Recovery requires restoration efforts.

---

# 30. Terrain Stability

Every terrain tile stores a Stability Rating.

Range

0–100

Factors increasing stability

✓ Dense vegetation

✓ Healthy forests

✓ Retaining walls

✓ Gentle slopes

Factors reducing stability

✗ Heavy rain

✗ Excavation

✗ Tree removal

✗ Construction

✗ Fire damage

---

# 31. Vegetation Stabilization

Plants strengthen soil.

Different vegetation provides different stability.

| Vegetation | Stability Bonus |
|-------------|----------------|
| Grass | Low |
| Shrubs | Medium |
| Small Trees | High |
| Mature Forest | Very High |

Removing forests immediately lowers terrain stability.

Newly planted forests require years to reach full effectiveness.

---

# 32. Wildfire Interaction

Wildfires influence terrain.

Immediate Effects

• Vegetation Loss

• Reduced Stability

• Increased Soil Temperature

Long-Term Effects

• Increased erosion

• Reduced biodiversity

• Slower groundwater recharge

Recovery depends on:

Rainfall

Reforestation

Time

---

# 33. Heat Absorption

Every terrain type absorbs heat differently.

| Terrain | Heat Storage |
|----------|--------------|
| Forest | Low |
| Grassland | Low |
| Wetland | Very Low |
| Sand | High |
| Rock | High |
| Asphalt | Very High |
| Concrete | Very High |

Urban expansion increases heat retention.

---

# 34. Urban Heat Island Effect

Large urban areas gradually become warmer.

Causes

• Asphalt

• Concrete

• Building Density

• Lack of Trees

Effects

Higher electricity demand.

Lower citizen comfort.

Higher pollution reactions.

Reduced rainfall infiltration.

Urban forests reduce this effect.

---

# 35. Rainfall Runoff

Rain falling on terrain has four possible outcomes.

1.

Absorption

↓

Groundwater

---

2.

Surface Runoff

↓

Rivers

---

3.

Evaporation

↓

Atmosphere

---

4.

Temporary Storage

↓

Lakes

↓

Wetlands

↓

Floodplains

The proportion depends on:

- Soil
- Vegetation
- Slope
- Rainfall Intensity

---

# 36. Drainage Network

Water naturally follows terrain.

Every terrain tile has a drainage direction.

Poor drainage causes:

• Flooding

• Waterlogging

• Crop Damage

• Road Damage

Players may improve drainage by:

• Preserving rivers

• Protecting wetlands

• Creating drainage channels

• Increasing green spaces

---

# 37. Terrain and Climate Interaction

Terrain influences local climate.

Higher Elevation

↓

Lower Temperature

Forests

↓

Higher Humidity

Urban Areas

↓

Higher Temperature

Wetlands

↓

Lower Temperature

Hills

↓

Wind Deflection

These interactions are simplified but scientifically inspired.

---

# 38. Terrain Simulation Cycle

Each simulation update follows this order:

1. Weather Update

↓

2. Rainfall

↓

3. Water Flow

↓

4. Soil Moisture

↓

5. Groundwater Recharge

↓

6. Erosion

↓

7. Vegetation Growth

↓

8. Stability Calculation

↓

9. Landslide Check

↓

10. Buildability Update

↓

11. Environmental Score Update

This order ensures consistent environmental behavior.

---

# 39. Simulation Principles

Terrain is always changing.

Natural processes continue regardless of player actions.

Ignoring environmental degradation leads to long-term consequences.

Restoration is slower than destruction.

Sustainable planning results in greater long-term stability.

---

# Improvements Introduced in Version 1.2

✓ Added complete erosion simulation.

✓ Introduced sediment transport.

✓ Added landslide mechanics.

✓ Connected vegetation with terrain stability.

✓ Added wildfire-terrain interaction.

✓ Implemented heat absorption model.

✓ Added Urban Heat Island simulation.

✓ Introduced rainfall runoff.

✓ Added drainage network.

✓ Defined terrain simulation cycle.

---

# 40. Terrain State Machine

Every terrain tile exists in one of five states.

Terrain states describe the current environmental health of the land.

---

## STATE-001

### Stable

Characteristics

- Healthy vegetation
- Normal erosion
- Good buildability
- High groundwater recharge
- Balanced ecosystem

Player Action

Maintain current conditions.

---

## STATE-002

### Developing

Characteristics

- Active construction
- Moderate terrain modification
- Temporary disturbance

Possible Outcomes

- Returns to Stable after restoration.
- Degrades if unmanaged.

---

## STATE-003

### Degrading

Characteristics

- Increasing erosion
- Declining vegetation
- Soil fertility loss
- Reduced stability

Warning

Environmental damage is becoming visible.

Player Action

Conservation measures recommended.

---

## STATE-004

### Critical

Characteristics

- Severe erosion
- High landslide probability
- Low fertility
- Poor groundwater recharge
- High flood risk

Gameplay Impact

Construction costs increase.

Agricultural output decreases.

Wildlife begins migrating.

Citizen satisfaction decreases.

---

## STATE-005

### Recovering

Characteristics

- Restoration projects active
- Trees regrowing
- Soil improving
- Stability increasing

Recovery takes time.

Healthy ecosystems cannot instantly regenerate.

---

# 41. Terrain Update Schedule

Not every terrain value updates every frame.

To improve performance, systems update at different frequencies.

| System | Update Frequency |
|----------|----------------|
| Surface Temperature | Every Hour |
| Soil Moisture | Every Hour |
| Water Flow | Every Hour |
| Vegetation Growth | Daily |
| Stability | Daily |
| Heat Island | Daily |
| Groundwater | Weekly |
| Erosion | Weekly |
| Fertility | Monthly |
| Landslide Risk | Weekly |
| Long-Term Weathering | Yearly |

This reduces CPU usage while maintaining realistic simulation.

---

# 42. Terrain Events

Terrain can generate environmental events.

Examples include:

### Minor Events

• Small Soil Erosion

• Local Flooding

• Riverbank Collapse

• Sand Movement

---

### Major Events

• Landslide

• Large Cliff Collapse

• Coastal Erosion

• Sinkhole (Future)

• Ground Failure

Major events are influenced by environmental conditions rather than random chance.

---

# 43. Terrain Balancing Rules

Terrain should never unfairly punish experimentation.

Instead, poor environmental decisions should create logical long-term consequences.

Examples

Flattening hills

↓

Lower construction cost

↓

Higher flood risk

↓

Higher maintenance

↓

Greater disaster damage

Players remain free to choose unsustainable development.

The simulation teaches why sustainable planning is preferable.

---

# 44. Developer Constraints

Future systems must follow these rules.

Rule 1

Never directly modify terrain values.

Use the Terrain Engine.

---

Rule 2

Terrain always remains the single source of truth.

Other systems read terrain data.

They do not own terrain data.

---

Rule 3

Terrain changes must propagate through the Simulation Engine.

Never update unrelated systems manually.

---

Rule 4

Environmental realism has higher priority than artificial balancing.

---

Rule 5

Performance should always be considered before increasing simulation complexity.

---

# 45. Cross-System Integration

Terrain provides information to:

WORLD-003

Water

Receives:

Elevation

Slope

Drainage

Soil

---

WORLD-004

Forests

Receives:

Soil

Moisture

Slope

Temperature

---

WORLD-005

Climate

Receives:

Elevation

Surface Temperature

Vegetation

Heat Absorption

---

WORLD-006

Wildlife

Receives:

Habitat

Slope

Forest Density

Water Availability

---

WORLD-008

Buildings

Receives:

Buildability

Foundation Quality

Construction Cost

Flood Risk

---

WORLD-009

Citizens

Receives:

Environmental Quality

Heat

Flood Risk

Green Space

---

SIM-001

Core Simulation

Coordinates every terrain update.

---

# 46. Future Expansion

The Terrain System is designed for future growth.

Possible additions include:

• Mining

• Underground Infrastructure

• Earthquakes

• Caves

• Tunnels

• Landslide Engineering

• Coastal Reclamation

• Soil Restoration Technologies

• Geological Surveys

• Underground Water Reservoirs

• Advanced Terrain Editing

These features should extend the existing system without replacing it.

---

# 47. Educational Objectives

After interacting with the Terrain System, players should understand:

- Why hills reduce flooding.
- Why forests stabilize soil.
- Why wetlands store water.
- Why construction depends on geology.
- Why groundwater requires healthy land.
- Why erosion is difficult to reverse.
- Why sustainable planning protects future generations.

Learning occurs naturally through simulation and experimentation.

---

# 48. Technical Notes

The Terrain System is data-driven.

Terrain should be represented as a grid of independent tiles.

Each tile stores only the data necessary for simulation.

Neighboring tiles exchange information through the Simulation Engine.

The architecture must remain modular to support future expansion.

Terrain calculations should be deterministic to ensure consistent gameplay.

---

# 49. Revision History

| Version | Changes |
|----------|----------|
| 1.0 | Initial Terrain System |
| 1.1 | Added Soil, Rock, Excavation |
| 1.2 | Added Erosion and Stability |
| 1.3 | Added State Machine, System Integration, Performance Model |

---

# 50. Approval

Document Status

Approved

Document Owner

EcoQuest Development Team

Primary Purpose

Defines the complete Terrain System and acts as the authoritative reference for every geological, construction, and environmental process within EcoQuest.

End of Document