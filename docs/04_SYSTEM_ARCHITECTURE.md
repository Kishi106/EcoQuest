# 04 — System Architecture

**Document type:** Engineering Specification
**Scope:** Complete, self-contained runtime software architecture of EcoQuest — module boundaries, communication contracts, execution model, data schema, bootstrap sequence, failure handling, performance strategy, persistence, build/deploy shape, testing strategy, security posture, and physical folder layout. This document is written to stand alone: an engineer should be able to implement the system from this file without needing to consult a separate spec for any of the above. Narrower companion docs (`Database.md`, `SimulationEngine.md`, `14_Balancing.md`, etc.) may still exist for deep-dive detail on their specific topic, but nothing here depends on them.

---

## 1. Architectural Goals & Constraints

These five constraints are non-negotiable and every decision below is justified against them.

1. **Determinism.** Given the same seed and the same ordered input log, the simulation must produce bit-identical state on every run. This is required for save/load correctness, replay, debugging, and (later) any shared-seed challenge mode. Determinism rules out: `Math.random()` anywhere in sim code, object-key iteration order dependence, floating-point operations whose order isn't fixed, and wall-clock-based timing inside the simulation step.
2. **Single source of truth per fact.** Every piece of world state is owned by exactly one module. No module caches another module's authoritative data without an explicit invalidation contract (Section 6).
3. **Data-driven behavior.** Game *tuning* (costs, rates, thresholds) lives in JSON/data tables, not in code. Game *rules* (causal relationships — e.g. "pollution reduces wildlife spawn weight") live in code, because they are structural, not numeric.
4. **Performance budget.** Target: 10,000+ simulated tiles, 5,000+ agents (citizens + wildlife), steady 60fps render / 10Hz sim tick, on mid-range hardware (2019-era laptop GPU, 4-core CPU). This drives the ECS + Web Worker + spatial partitioning decisions in Sections 3 and 8.
5. **Independent testability.** Each module must be unit-testable with zero DOM, zero renderer, and zero real-time clock. This drives the strict layering in Section 2 and the interface-only coupling in Section 6.

---

## 2. Layered Architecture

Four layers, strictly one-directional dependency (a layer may only depend on layers below it, never above or sideways within the same layer without going through the Event Bus):

```
┌─────────────────────────────────────────────────────────┐
│  L4 — PRESENTATION                                       │
│  ART (renderer) · UI · AUD                                │
│  Reads simulation state, NEVER mutates it directly.       │
└───────────────────────────▲────────────────────────────┘
                             │ read-only snapshots + events
┌───────────────────────────┴────────────────────────────┐
│  L3 — ORCHESTRATION                                       │
│  SimulationKernel · TickScheduler · EventBus · Command    │
│  Router. Owns the game loop. No domain logic lives here.  │
└───────────────────────────▲────────────────────────────┘
                             │ commands in, deltas out
┌───────────────────────────┴────────────────────────────┐
│  L2 — DOMAIN MODULES  (the 12-module taxonomy)             │
│  WORLD · SIM · RES · BLD · CIT · ENV · WTH · MIS · BAL     │
│  Each is a self-contained system with its own state slice, │
│  update function, and published interface (Section 6).     │
└───────────────────────────▲────────────────────────────┘
                             │ pure data reads/writes
┌───────────────────────────┴────────────────────────────┐
│  L1 — DATA LAYER                                           │
│  WorldStateStore (in-memory, normalized) · PersistenceGate │
│  (IndexedDB via idb) · DataTableRegistry (static JSON)      │
└─────────────────────────────────────────────────────────┘
```

**Rule:** L4 code (renderer, UI, audio) never imports from L2 domain modules directly. It only consumes `WorldStateSnapshot` objects and subscribes to `EventBus` topics. This is what keeps rendering swappable (Canvas2D now, WebGL/WebGPU later) without touching simulation code, and is what makes L2 unit-testable headlessly.

**Rule:** L2 domain modules never import each other's internal classes. Cross-module reads go through `WorldStateStore` selectors; cross-module effects go through the `EventBus` or `CommandRouter`. This is the mechanism that prevents the duplicated/tangled logic you flagged as a risk.

---

## 3. Execution Model

### 3.1 Two clocks, not one

EcoQuest runs two independent loops, deliberately decoupled:

| Loop | Rate | Runs where | Responsibility |
|---|---|---|---|
| **Render loop** | `requestAnimationFrame` (~60Hz, variable) | Main thread | Interpolate between the last two sim snapshots, draw, handle input, animate UI/audio |
| **Sim loop** | Fixed 10Hz (100ms/tick), decoupled from frame rate | Web Worker (`sim.worker.ts`) | Advance world state by exactly one tick per call, deterministically |

Decoupling these two is what buys determinism-under-variable-framerate: the simulation never knows or cares how fast the screen is refreshing. The render loop interpolates position/visual state between `tick N` and `tick N+1` snapshots using a `alpha = accumulator / TICK_MS` blend factor — standard fixed-timestep-with-interpolation pattern.

```typescript
// L3 — TickScheduler (runs on main thread, drives the worker)
class TickScheduler {
  private accumulator = 0;
  private readonly TICK_MS = 100;
  private worker: Worker;

  onFrame(deltaMs: number) {
    this.accumulator += Math.min(deltaMs, 250); // clamp to avoid spiral of death
    while (this.accumulator >= this.TICK_MS) {
      this.worker.postMessage({ type: 'ADVANCE_TICK' });
      this.accumulator -= this.TICK_MS;
    }
    const alpha = this.accumulator / this.TICK_MS;
    Renderer.draw(this.latestSnapshot, this.previousSnapshot, alpha);
  }
}
```

### 3.2 Why simulation runs in a Web Worker

At 5,000+ agents with pathfinding, resource flow, and environmental diffusion all ticking at 10Hz, the sim step is the single most expensive operation in the frame budget. Isolating it in a worker:

- guarantees UI stays responsive (input, menus, camera pan) even under simulation load;
- enforces the determinism boundary structurally — the worker has no access to `Date.now()`, `window`, or DOM, so non-deterministic APIs can't leak in by accident;
- makes the sim/render split in Section 2 physically enforced by the process boundary, not just a convention.

Communication is one-directional-per-message: main thread posts `Command` objects in, worker posts `WorldStateDelta` (not full snapshots — see 3.3) back out via `postMessage`, structured-clone-serialized.

### 3.3 Delta-based state sync (not full snapshots)

Serializing 10,000+ tiles and 5,000+ agents every 100ms across the worker boundary would blow the performance budget. Instead:

- Worker maintains authoritative `WorldState` internally.
- After each tick, worker computes a `WorldStateDelta` — only the fields that changed this tick, keyed by entity ID and component type (see ECS layout, Section 4).
- Main thread maintains a mirror `WorldStateStore` and applies deltas additively.
- Every 50 ticks (5s), a full checkpoint snapshot is sent instead of a delta, as a self-healing measure against any delta-application drift (defensive, should never trigger in a correct system — it exists for resilience against future bugs, not because determinism is expected to fail).

```typescript
interface WorldStateDelta {
  tick: number;
  changed: {
    entityId: EntityId;
    component: ComponentType;   // e.g. 'Position', 'PollutionLevel'
    value: unknown;
  }[];
  removedEntities: EntityId[];
  addedEntities: { id: EntityId; components: ComponentBundle }[];
}
```

---

## 4. Data Architecture: Entity-Component-System

Every simulated object — a tile, a building, a citizen, a wildlife individual, a weather cell — is an **entity**: just a numeric ID. All data lives in **components** (plain data, no methods). All behavior lives in **systems** (pure functions: `(components, dt) => componentDeltas`). This is what makes L2 modules independently testable (a system is just a function you call with fixture data) and what makes the delta-sync in 3.3 possible (deltas are naturally component-shaped).

```typescript
type EntityId = number; // dense integer, reused via free-list on despawn

// Components are grouped in typed arrays (structure-of-arrays), not
// per-entity objects, for cache locality at 5,000+ agent scale.
interface ComponentStore<T> {
  data: Map<EntityId, T>;       // logical view
  dense: T[];                    // packed backing array for iteration
  entityOf: EntityId[];          // dense[i] belongs to entityOf[i]
}
```

### 4.1 Full Component Data Dictionary

Every component type in the game, grouped by owning module. This is the complete authoritative schema — nothing about component shape lives outside this section.

**WORLD**

```typescript
interface Position        { x: number; y: number; }                          // tile or agent world coords
interface TileTerrain      { type: TerrainType; elevation: number; slope: number; }
interface WaterTable       { level: number; flowDirection: [number, number]; salinity: number; }
interface Vegetation       { coverPct: number; biomassDensity: number; growthStage: 0|1|2|3; }
interface CoastlineFlag    { isCoastal: boolean; erosionRate: number; }

type TerrainType = 'plains' | 'forest' | 'wetland' | 'mountain' | 'desert' | 'coastal' | 'water';
```

**SIM** (kernel bookkeeping, not gameplay data)

```typescript
interface SimClock         { tick: number; seed: number; realTimeAtLastSave: number; }
```

**RES**

```typescript
interface ResourceStock    { resourceType: ResourceId; amount: number; capacity: number; }
interface ProductionRate   { resourceType: ResourceId; baseRate: number; modifiedRate: number; }
interface SupplyChainEdge  { fromEntity: EntityId; toEntity: EntityId; resourceType: ResourceId; throughputPerTick: number; }
interface WasteOutput      { wasteType: WasteId; volumePerTick: number; recycledPct: number; }

type ResourceId = 'water' | 'electricity' | 'food' | 'timber' | 'ore' | 'recycledMaterial';
type WasteId = 'solidWaste' | 'wastewater' | 'emissions';
```

**BLD**

```typescript
interface BuildingState    { defId: string; operational: boolean; efficiency: number; ageInTicks: number; }
interface BuildingDef      { id: string; footprint: [number, number]; buildCost: Partial<Record<ResourceId, number>>; category: BuildingCategory; }
interface ZoneAssignment   { zoneType: 'residential' | 'commercial' | 'industrial' | 'green'; density: 'low' | 'med' | 'high'; }

type BuildingCategory = 'residential' | 'commercial' | 'industrial' | 'utility' | 'civic' | 'green';
```

**CIT**

```typescript
interface CitizenNeeds     { food: number; water: number; health: number; happiness: number; } // each 0-100
interface CitizenLocation  { homeEntity: EntityId; workEntity: EntityId | null; currentTile: EntityId; }
interface Employment       { employed: boolean; workplaceEntity: EntityId | null; incomePerTick: number; }
interface Household        { size: number; composition: { adults: number; children: number }; }
```

**ENV**

```typescript
interface PollutionLevel   { air: number; water: number; soil: number; } // 0-100 each, higher = worse
interface BiodiversityIndex{ score: number; trendPerTick: number; } // 0-100 composite score
interface WildlifePop      { species: string; count: number; habitatQuality: number; }
interface HabitatPatch     { suitabilityScore: number; fragmentationIndex: number; }
```

**WTH**

```typescript
interface WeatherCell      { condition: WeatherCondition; temperatureC: number; windSpeed: number; }
interface Precipitation    { mmPerTick: number; type: 'rain' | 'snow' | 'none'; }
interface Season           { current: 'spring' | 'summer' | 'autumn' | 'winter'; dayInSeason: number; }

type WeatherCondition = 'clear' | 'cloudy' | 'rain' | 'storm' | 'drought' | 'heatwave' | 'snow';
```

**MIS**

```typescript
interface MissionState     { missionId: string; status: 'available' | 'active' | 'completed' | 'failed'; }
interface ObjectiveProgress{ objectiveId: string; current: number; target: number; }
```

**BAL**

```typescript
interface BalanceCurve       { curveId: string; controlPoints: [number, number][]; } // piecewise-linear tuning curve
interface DifficultyModifier { modifierId: string; multiplier: number; expiresAtTick: number | null; }
```

All numeric "0-100" style fields are stored as `Float32` in the dense backing arrays (Section 4) for memory density at scale; TypeScript's `number` type is the logical view exposed to system code.

**Module ownership of components** (enforces "single source of truth" from Section 1):

| Component family | Owning module | Read access |
|---|---|---|
| `TileTerrain`, `Elevation`, `WaterTable` | WORLD | all (read-only) |
| `ResourceStock`, `ProductionRate`, `SupplyChainEdge` | RES | BLD, CIT (read-only) |
| `BuildingState`, `BuildingDef`, `ZoneAssignment` | BLD | RES, CIT, ENV (read-only) |
| `CitizenNeeds`, `CitizenLocation`, `Employment` | CIT | UI (read-only) |
| `PollutionLevel`, `BiodiversityIndex`, `WildlifePop` | ENV | all (read-only) |
| `WeatherCell`, `Season`, `Precipitation` | WTH | ENV, RES (read-only) |
| `MissionState`, `ObjectiveProgress` | MIS | UI (read-only) |
| `BalanceCurve`, `DifficultyModifier` | BAL | all (read-only, values only) |

A module may **write** only its own family. A module that needs another module's data **reads** it through a selector (Section 6.2) — it never writes it, even transitively. If BLD needs to reduce a resource stock, it does not decrement `ResourceStock` directly; it emits a `CONSUME_RESOURCE` command that RES's system processes (Section 5).

---

## 5. Inter-Module Communication: Commands & Events

Two channels, deliberately asymmetric, because "request to change something" and "something changed" have different consumers and different failure semantics.

### 5.1 Commands (imperative, one producer → one handler, can fail)

A **Command** is a request for a specific module to do something. Exactly one system handles a given command type. Commands can be rejected (insufficient resources, invalid placement, etc.) and rejection is synchronous within the same tick.

```typescript
interface Command<TPayload = unknown> {
  type: string;              // e.g. 'BLD.PLACE_BUILDING'
  payload: TPayload;
  issuedByEntity?: EntityId; // for attribution/undo
  tick: number;
}

interface CommandResult {
  success: boolean;
  reason?: string;           // populated on failure, for UI feedback
  affectedEntities: EntityId[];
}

// Example: placing a building touches BLD (creates entity), RES (reserves
// build cost), WORLD (validates terrain), ENV (will later react to it).
// Only BLD *handles* the command; it internally issues sub-commands to RES.
class CommandRouter {
  private handlers = new Map<string, (p: unknown, tick: number) => CommandResult>();

  register(type: string, handler: (p: unknown, tick: number) => CommandResult) {
    if (this.handlers.has(type)) throw new Error(`Duplicate handler for ${type}`);
    this.handlers.set(type, handler);
  }

  dispatch(cmd: Command): CommandResult {
    const handler = this.handlers.get(cmd.type);
    if (!handler) throw new Error(`No handler registered for ${cmd.type}`);
    return handler(cmd.payload, cmd.tick);
  }
}
```

Command naming convention: `MODULE.VERB_NOUN`, always present-tense imperative. Examples: `BLD.PLACE_BUILDING`, `RES.TRANSFER_STOCK`, `CIT.RELOCATE_CITIZEN`, `MIS.COMPLETE_OBJECTIVE`.

### 5.2 Events (declarative, one producer → many subscribers, cannot fail)

An **Event** is a broadcast fact: something already happened. Any number of modules (including L4 presentation) may subscribe. Events never carry a response channel — a subscriber that wants to react issues its own Command.

```typescript
interface WorldEvent<TPayload = unknown> {
  type: string;               // e.g. 'ENV.POLLUTION_THRESHOLD_CROSSED'
  payload: TPayload;
  tick: number;
}

class EventBus {
  private subscribers = new Map<string, Set<(e: WorldEvent) => void>>();

  subscribe<T>(type: string, fn: (e: WorldEvent<T>) => void): () => void {
    if (!this.subscribers.has(type)) this.subscribers.set(type, new Set());
    this.subscribers.get(type)!.add(fn as never);
    return () => this.subscribers.get(type)!.delete(fn as never); // unsubscribe
  }

  publish(event: WorldEvent) {
    this.subscribers.get(event.type)?.forEach(fn => fn(event));
    this.subscribers.get('*')?.forEach(fn => fn(event)); // wildcard, for logging/replay
  }
}
```

Event naming convention: `MODULE.NOUN_PAST_TENSE`. Examples: `ENV.POLLUTION_THRESHOLD_CROSSED`, `WTH.SEASON_CHANGED`, `RES.STOCK_DEPLETED`, `CIT.CITIZEN_LEFT_CITY`, `MIS.OBJECTIVE_COMPLETED`.

**Determinism note:** event *publication order within a tick* must be deterministic. This is guaranteed by giving every module a fixed execution priority in the tick pipeline (Section 7) — events are always published in module-priority order, never in wall-clock or async order, since the entire sim step is synchronous.

### 5.3 Cross-module read access: selectors

For pure reads (no mutation, no side effect), modules don't need the ceremony of a command. They call a **selector**, a pure function published by the owning module against the shared `WorldStateStore`.

```typescript
// Published by ENV, consumed (read-only) by BLD to decide if a factory
// should throttle production due to local air pollution.
export const selectAirPollutionAt = (store: WorldStateStore, tileId: EntityId): number =>
  store.get<PollutionLevel>(tileId, 'PollutionLevel')?.air ?? 0;
```

Every module publishes its selectors from a single `<module>/selectors.ts` file — this is the module's public read API, analogous to how commands are its public write API. Nothing outside a module reaches into its component stores directly; everything goes through these two files. This pairing (`commands.ts` + `selectors.ts` per module) **is** the module's interface contract, and is the artifact that should be reviewed when checking whether a module boundary is clean.

---

## 6. Module Contract Template

Every one of the 12 domain modules (WORLD, SIM, RES, BLD, CIT, ENV, WTH, MIS, UI, ART, AUD, BAL) implements the same structural contract, so that adding a 13th module later requires zero changes to L3 orchestration:

```typescript
interface DomainModule {
  readonly id: ModuleId;
  readonly tickPriority: number;      // fixed integer, see Section 7 ordering

  // Lifecycle
  init(store: WorldStateStore, tables: DataTableRegistry): void;
  onTick(store: WorldStateStore, tick: number, bus: EventBus): void;

  // Public interface (the ONLY legal points of cross-module contact)
  commands: Record<string, CommandHandler>;
  selectors: Record<string, Selector>;

  // Persistence hook — module serializes/restores its own component slice
  serialize(store: WorldStateStore): SerializedModuleState;
  deserialize(store: WorldStateStore, data: SerializedModuleState): void;
}
```

Each module's own folder (see `FolderStructure.md` for the physical layout) contains: `system.ts` (the `onTick` logic), `commands.ts`, `selectors.ts`, `components.ts` (type defs), and `<module>.test.ts` (headless unit tests against fixture `WorldState`, per the testability constraint in Section 1).

---

## 7. The Tick Pipeline

Fixed execution order per tick, because determinism requires it and because it encodes real causal dependency (e.g., weather must resolve before environment reacts to it, which must resolve before resources are affected by environment):

```
1.  WTH   — advance weather cells, season progression
2.  WORLD — apply weather effects to terrain/water table (erosion, flooding)
3.  RES   — production, distribution, consumption, waste generation
4.  ENV   — pollution diffusion, biodiversity index update, wildlife pop dynamics
5.  BLD   — building efficiency recompute (affected by ENV + RES this same tick)
6.  CIT   — citizen needs update, migration, happiness (reads BLD + ENV + RES)
7.  MIS   — objective progress evaluation (reads everything above, read-only)
8.  BAL   — dynamic difficulty adjustment sampling (reads everything, read-only)
9.  [EventBus flush — all events queued during steps 1-8 publish now, in
     module-priority order, so subscribers never see a partial tick]
```

`SIM` is not a pipeline stage — it *is* the pipeline (the kernel that runs steps 1-9 in order and owns the `WorldStateStore` transaction). `UI`, `ART`, `AUD` are L4 and never appear in this list; they consume the flushed events and the post-tick snapshot only.

**Why this fixed order matters for determinism:** if two modules both read and wrote the same tick's `PollutionLevel`, the result would depend on which ran first. Fixing the order at fixed integer priorities (not registration order, not object-key order) makes step 4's output well-defined regardless of module load order elsewhere in the codebase.

```typescript
class SimulationKernel {
  private modules: DomainModule[]; // sorted by tickPriority at construction

  advanceTick(commands: Command[]): WorldStateDelta {
    const tick = this.currentTick + 1;
    const changeLog = this.store.beginTransaction();

    for (const cmd of commands) this.commandRouter.dispatch(cmd);
    for (const module of this.modules) module.onTick(this.store, tick, this.eventBus);

    this.eventBus.flush(); // publishes everything queued this tick, in priority order
    this.currentTick = tick;
    return this.store.commitTransaction(changeLog); // -> WorldStateDelta
  }
}
```

---

## 8. Performance Architecture

Four techniques address the 10,000-tile / 5,000-agent budget from Section 1, each targeting a specific bottleneck:

### 8.1 Spatial partitioning (bottleneck: neighbor queries)

The world is divided into a uniform grid of **chunks** (64×64 tiles each). Any query of the form "what's near entity X" (pollution diffusion neighbors, wildlife habitat scan, citizen pathfinding search space) is scoped to the entity's chunk plus adjacent chunks, not the full world. `WorldStateStore` indexes entities by chunk ID as a `Map<ChunkId, Set<EntityId>>`, updated incrementally on movement rather than rebuilt per tick.

### 8.2 Dirty-flagging (bottleneck: redundant recomputation)

Expensive derived values — pollution diffusion, biodiversity index, building efficiency — are only recomputed for chunks marked dirty since the last tick they touched. A chunk is marked dirty when any component inside it changes. Static, unchanging regions of a large map (e.g. an untouched forest far from the city) cost near-zero per tick once they stabilize.

### 8.3 LOD for agent simulation (bottleneck: per-agent AI cost)

Citizens and wildlife individuals beyond a distance threshold from the camera/city center run a cheaper **aggregate simulation** (statistical — "N citizens in this zone consume X food/tick") instead of full per-agent pathfinding and needs simulation. Agents are promoted to full simulation as the player's view approaches them, and demoted back to aggregate when they leave the active radius. This is the single largest lever for hitting the 5,000-agent target on mid-range hardware.

### 8.4 Structure-of-arrays component storage (bottleneck: cache misses)

As shown in Section 4, components are stored as packed typed arrays per component type, not as properties on per-entity objects. Iterating "all entities with `PollutionLevel`" walks one contiguous array instead of dereferencing 10,000 scattered object pointers. This is standard ECS practice and is what makes 10Hz ticking of 10,000+ tiles feasible in JS without WASM.

---

## 9. Persistence Architecture

Handled at the `WorldStateStore` boundary, not per-module, so save/load logic doesn't need to know about the 12-module taxonomy:

- **Format:** each module's `serialize()` (Section 6) returns its own component slice as a flat, versioned JSON-serializable object. `PersistenceGate` concatenates all module slices plus a header (`{ schemaVersion, tick, seed, savedAt }`) into one save document.
- **Storage:** IndexedDB via the `idb` wrapper library, keyed by save-slot ID. Chosen over `localStorage` because save documents (10,000+ tiles worth of component data) will exceed `localStorage`'s ~5-10MB practical ceiling.
- **Versioning:** `schemaVersion` gates a migration chain (`migrations/v1_to_v2.ts`, etc.) run on load if the save's version is older than current. Every module contract change that alters a component's shape must ship a migration; this is a hard rule, not a suggestion, because save-breaking updates are a player-trust issue.
- **Determinism check on load:** after `deserialize()`, the kernel re-derives all dirty-flag caches (Section 8.2) rather than trusting cached derived values from the save — derived state is never itself persisted, only source-of-truth component data is. This guarantees a loaded game is bit-identical to the equivalent live game, not just visually similar.

---

## 10. Presentation Layer Boundary (L4)

Restated precisely because it's the most commonly violated boundary in game codebases:

- **ART** (renderer) subscribes to the post-tick `WorldStateDelta` stream and the interpolation alpha from `TickScheduler` (Section 3.1). It never calls into any L2 module's commands or systems. Rendering technology (Canvas2D today) is swappable behind this boundary without touching simulation code.
- **UI** issues `Command` objects on player input (Section 5.1) and subscribes to `EventBus` topics for feedback (e.g., disabling a "place building" button on `RES.STOCK_DEPLETED`). It reads current state only via selectors (Section 5.3), never via direct store access.
- **AUD** subscribes to `EventBus` only. It has no read access to component state at all — every sound cue is event-triggered (`WTH.SEASON_CHANGED` → ambient track swap; `MIS.OBJECTIVE_COMPLETED` → stinger), which keeps audio fully decoupled and independently testable by replaying an event log.

---

## 11. Module Interface Index

Quick-reference summary of what crosses each module boundary. Full field-level component schemas are in Section 4.1; this table is the contract surface, not the data dictionary.

| Module | Publishes (commands) | Publishes (selectors) | Publishes (events) |
|---|---|---|---|
| WORLD | `WORLD.MODIFY_TERRAIN` | `selectTerrainAt`, `selectElevationGrid` | `WORLD.TERRAIN_CHANGED` |
| SIM | *(kernel — no domain commands)* | `selectCurrentTick`, `selectSeed` | `SIM.TICK_ADVANCED` |
| RES | `RES.TRANSFER_STOCK`, `RES.CONSUME_RESOURCE` | `selectStockAt`, `selectFlowRate` | `RES.STOCK_DEPLETED`, `RES.SURPLUS_REACHED` |
| BLD | `BLD.PLACE_BUILDING`, `BLD.DEMOLISH_BUILDING` | `selectBuildingAt`, `selectEfficiency` | `BLD.BUILDING_PLACED`, `BLD.BUILDING_FAILED` |
| CIT | `CIT.RELOCATE_CITIZEN`, `CIT.ASSIGN_JOB` | `selectNeedsOf`, `selectPopulationDensity` | `CIT.CITIZEN_ARRIVED`, `CIT.CITIZEN_LEFT_CITY` |
| ENV | `ENV.APPLY_CLEANUP` | `selectAirPollutionAt`, `selectBiodiversityIndex` | `ENV.POLLUTION_THRESHOLD_CROSSED`, `ENV.SPECIES_EXTINCT_LOCALLY` |
| WTH | *(no external commands — autonomous)* | `selectWeatherAt`, `selectSeason` | `WTH.SEASON_CHANGED`, `WTH.STORM_STARTED` |
| MIS | `MIS.ACCEPT_MISSION` | `selectActiveMissions`, `selectObjectiveProgress` | `MIS.OBJECTIVE_COMPLETED`, `MIS.MISSION_FAILED` |
| BAL | *(no external commands — autonomous)* | `selectDifficultyModifier` | `BAL.MODIFIER_ADJUSTED` |
| UI | — (L4, consumer only) | — | `UI.PANEL_OPENED` (for AUD/analytics) |
| ART | — (L4, consumer only) | — | — |
| AUD | — (L4, consumer only) | — | — |

---

## 12. Bootstrap & Initialization Sequence

The fixed order in which the game goes from a cold page load to "tick 0 ready." Every step is synchronous-in-effect (later steps may not begin until earlier ones resolve), even though some are internally async (asset/data fetch).

```
1. main.ts loads on the main thread.
2. DataTableRegistry.loadAll() fetches and parses all static JSON tuning
   tables (building costs, resource rates, balance curves, species defs).
   Each table is schema-validated (zod) at this point — a malformed data
   file fails fast here, before any module touches it.
3. Main thread spawns sim.worker.ts (Web Worker) and posts an INIT message
   containing: the validated DataTableRegistry payload, the RNG seed
   (new game: crypto-random; loaded game: from save header), and either
   'NEW_GAME' or a deserialized save payload.
4. Inside the worker: SimulationKernel constructs WorldStateStore (empty),
   then instantiates all 9 domain modules (WORLD, SIM, RES, BLD, CIT, ENV,
   WTH, MIS, BAL) in a FIXED, HARD-CODED array literal — never discovered
   via directory scan or dynamic import, so module presence and tickPriority
   order (Section 7) are both compile-time guarantees, not runtime ones.
5. Each module's init(store, tables) runs, in the same fixed order. For a
   NEW_GAME, WORLD.init() generates the initial terrain (seeded, deterministic
   — see world-generation note below); other modules seed their starting
   component sets (e.g. CIT places the initial citizen population).
   For a LOADED game, each module's deserialize() runs instead of the
   procedural-generation path.
6. Worker posts INIT_COMPLETE with tick 0's full WorldStateDelta back to
   main thread.
7. Main thread's WorldStateStore mirror applies the delta, ART performs its
   first full draw, UI mounts, AUD starts ambient audio for the current
   season/weather (read from the tick-0 snapshot), and TickScheduler
   (Section 3.1) begins its requestAnimationFrame loop.
```

World generation (step 5, WORLD.init on NEW_GAME) uses the save seed to drive a deterministic procedural pipeline — noise-based elevation, then derived slope/water table, then biome assignment from elevation+moisture — so that two players entering the same seed get an identical starting map. This pipeline's specific noise functions and parameters are a WORLD-module implementation detail, not an architectural concern, but the determinism requirement on it is: given the same seed, `WORLD.init()` must produce bit-identical terrain, every time, with no dependency on system clock or execution timing.

---

## 13. Failure Handling & Recovery

Three distinct failure surfaces, each with a defined recovery strategy — "let it crash silently" is not acceptable at any of these boundaries:

### 13.1 Worker crash or unhandled exception mid-tick

The worker is wrapped in a top-level `try/catch` around `advanceTick()`. On an uncaught exception:
- the worker posts a `SIM_FAULT` message containing the error, the last-known-good tick number, and a serialized dump of the in-progress transaction (for bug reports);
- the main thread's `TickScheduler` halts the accumulator loop (Section 3.1) immediately — it does not keep attempting to advance;
- the UI shows a non-destructive "simulation paused" state and offers **Reload from last autosave** (Section 13.3) rather than silently continuing on corrupted state or silently losing progress.
- This event is also logged to the wildcard `EventBus` subscriber (Section 5.2) so a full input-command replay log is preserved for debugging, even though the tick itself did not complete.

### 13.2 `postMessage` / structured-clone failures

Because worker↔main communication is delta-based (Section 3.3), a dropped or malformed message would desync the main thread's mirror `WorldStateStore` from the worker's authoritative one. Mitigation is structural, not reactive: the periodic full-checkpoint snapshot (every 50 ticks, Section 3.3) puts an upper bound of 5 seconds on how long any desync can persist undetected. Additionally, each delta message carries a monotonically increasing `tick` field; if the main thread receives a tick number that isn't exactly `lastAppliedTick + 1`, it discards its mirror and requests an immediate out-of-cycle checkpoint rather than applying an out-of-order delta.

### 13.3 Save/load failure

- **Autosave cadence:** every 300 ticks (~5 minutes of sim time) and on every explicit player-initiated save, `PersistenceGate` writes to a rotating set of 3 autosave slots (not 1), so a single corrupted write never destroys the only recent save.
- **Write failure** (IndexedDB quota exceeded, browser storage disabled): caught at the `PersistenceGate` boundary, surfaced to UI as a dismissible warning, game continues running in-memory (no forced pause) since a failed save is not a failed game.
- **Load failure** (corrupted JSON, failed schema validation, migration chain error): `PersistenceGate` never allows a partially-deserialized state to reach `SimulationKernel`. Deserialization runs fully into a scratch `WorldStateStore` first; only on complete success does the kernel adopt it. On failure, the load is rejected outright and the player is offered the next-most-recent autosave slot instead of a corrupted world.

---

## 14. Build & Deployment Architecture

- **Bundler:** Vite. Chosen for fast dev-server HMR (important given the module count — 9 domain modules with their own test suites) and native support for bundling a Web Worker entry point (`sim.worker.ts`) as a separate chunk without extra config.
- **Output targets:** a single static bundle (HTML/JS/CSS/worker chunk/data-table JSON assets) — no server-side runtime is required, since all persistence is client-side IndexedDB (Section 9) and there is no multiplayer backend (Section 15 non-goals). This means deployment is "upload the `dist/` folder to any static host."
- **Environments:** `dev` (local Vite server, source maps on, `DataTableRegistry` schema-validation errors thrown as hard exceptions), `staging` (production build, but tuning tables loaded from an editable staging bucket so BAL/balance iteration doesn't require a rebuild), `production` (tuning tables bundled at build time for integrity — no runtime-fetched game-balance data in prod, to prevent tampering via a compromised CDN edge).
- **Asset pipeline:** sprite atlases and audio are content-hashed at build time (`[name].[hash].ext`) for long-lived CDN cache headers; `DataTableRegistry` JSON is bundled and validated at build time (not runtime-fetched in production) so a bad data file fails CI rather than failing in a player's browser.
- **CI gate:** every module's `<module>.test.ts` suite (Section 6) plus a full-pipeline determinism regression test (Section 15) must pass before a build is eligible for staging or production deploy.

---

## 15. Testing Strategy

Directly enforced by the architecture rather than bolted on, because Section 1's testability constraint shaped the module boundaries:

- **Unit tests (per module):** each `DomainModule`'s `onTick` is called directly against a hand-built fixture `WorldState` — no worker, no renderer, no browser APIs required. This is possible specifically because Section 2's layering forbids L2 modules from touching DOM/Worker/timing APIs.
- **Determinism regression test:** run the full `SimulationKernel` for N ticks from a fixed seed, twice, in two separate processes; assert the resulting `WorldState` hashes are identical. This test exists specifically to catch violations of the Section 1 determinism constraint (e.g. an accidental `Date.now()` or unordered `Object.keys()` iteration introduced by a future change) and runs in CI on every PR that touches an L2 module.
- **Contract tests (per module boundary):** for every entry in the Section 11 interface index, a test asserts the command/selector/event exists with the expected shape — this is what catches an accidental breaking change to a module's public interface before it reaches a consumer module.
- **Integration/golden-save tests:** a small set of curated save files (empty city, mid-game city, disaster-recovery scenario) are loaded, ticked forward a fixed number of steps, and diffed against expected golden output — catches cross-module regressions that per-module unit tests can't see (e.g. a change to ENV's pollution formula that unexpectedly starves CIT's happiness calc).
- **Performance regression test:** a synthetic 10,000-tile / 5,000-agent world is ticked for a fixed duration in CI with wall-clock timing asserted against the Section 8 budget (10Hz sustained) — prevents the performance techniques in Section 8 from silently regressing as gameplay features are added.

---

## 16. Security & Integrity Considerations

Scoped to what's relevant for a client-only, no-backend static web game — this is deliberately not a generic web-security checklist:

- **Save-file tampering:** since saves live in client-controlled IndexedDB, a player can edit their own save. This is treated as acceptable (single-player, no leaderboard/shared-state to protect) rather than defended against with obfuscation or checksums — effort is better spent on the schema-validation-on-load in Section 13.3, which exists for corruption resilience, not anti-cheat.
- **Data-table integrity:** production tuning data is build-time bundled, not runtime-fetched (Section 14), specifically so a compromised or MITM'd CDN response can't rewrite game balance at runtime.
- **Worker isolation as a security boundary, not just a performance one:** because the sim worker has no DOM access, a hypothetical injection into simulation-derived rendering strings (e.g. a mod's custom mission text, if modding is ever added per Section 18) cannot reach the DOM directly from worker code — it must pass through the render layer's own escaping, which is standard React/DOM text-node handling, not `innerHTML`.
- **No user-generated network input exists in this architecture** (no multiplayer, no server) — the traditional web-app attack surface (auth, API injection, XSS-via-server-data) does not apply and is not covered here.

---

## 17. Folder Structure Mapping

Physical layout mirrors the architectural layers (Section 2) and module contract (Section 6) directly, so navigating the codebase requires no separate mental map:

```
src/
├── main.ts                      # L4 entry point — bootstraps per Section 12
├── kernel/                      # L3 — orchestration, no domain logic
│   ├── SimulationKernel.ts
│   ├── TickScheduler.ts
│   ├── CommandRouter.ts
│   ├── EventBus.ts
│   └── WorldStateStore.ts       # L1 — component storage + delta engine
├── data/                        # L1 — static tuning tables + registry
│   ├── DataTableRegistry.ts
│   ├── schemas/                 # zod schemas, one per table type
│   └── tables/*.json
├── modules/                     # L2 — one folder per domain module,
│   │                             #      each implementing Section 6's contract
│   ├── world/   { system.ts, commands.ts, selectors.ts, components.ts, world.test.ts }
│   ├── sim/     { ... }
│   ├── res/     { ... }
│   ├── bld/     { ... }
│   ├── cit/     { ... }
│   ├── env/     { ... }
│   ├── wth/     { ... }
│   ├── mis/     { ... }
│   └── bal/     { ... }
├── worker/
│   └── sim.worker.ts             # hosts SimulationKernel per Section 3.2
├── presentation/                 # L4
│   ├── art/                      # renderer, Canvas2D today
│   ├── ui/                       # React (or equivalent) panels, HUD
│   └── audio/                    # event-triggered cue system, Section 10
├── persistence/
│   ├── PersistenceGate.ts        # Section 9 + 13.3
│   └── migrations/v{N}_to_v{N+1}.ts
└── shared/                       # cross-cutting types only — EntityId,
                                   # ComponentType unions, no logic
```

One folder per L2 module, each containing exactly the five files named in Section 6 — this 1:1 mapping between the architectural module list and the physical directory list is intentional and should be treated as invariant: a 13th module (Section 18) means a 13th folder, not a new subfolder inside an existing one.

---

## 18. Explicit Non-Goals

Stated to prevent scope creep from being read back into this document later:

- **Multiplayer/networking** is not addressed here. The deterministic-tick design in Section 7 is a *prerequisite* for lockstep multiplayer if it's ever added, but no netcode exists in this architecture.
- **WASM/native compute** is not part of the current architecture. Section 8's techniques are chosen specifically to hit the performance budget in plain TypeScript; a WASM sim core is a valid future escalation if profiling shows the JS ECS approach insufficient at higher entity counts, but it's out of scope until that's measured, not assumed.
- **Modding/plugin API** is not covered. The module contract in Section 6 is *compatible* with a future plugin system (a mod is just a 13th `DomainModule`), but no dynamic loading, sandboxing, or mod-facing API is specified here.