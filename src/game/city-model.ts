export type Difficulty = 'easy' | 'normal' | 'hard'
export type CityMode = 'campaign' | 'sandbox'
export type StartingMap = 'coastal' | 'hills' | 'estuary'
export type BuildingType =
  | 'civic'
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'road'
  | 'school'
  | 'hospital'
  | 'renewable'
  | 'treatment'
  | 'water'
  | 'tree'
  | 'park'
  | 'forest'
  | 'cleanup'
  | 'coastal'
export type PolicyKey = 'renewable' | 'waste' | 'water' | 'transport' | 'protection'
export type ToolId = BuildingType | 'terrain-up' | 'terrain-down'

export type Building = {
  id: string
  type: BuildingType
  x: number
  z: number
  name: string
  placedAt: number
}

export type CityEvent = { id: string; day: number; title: string; body: string; tone: 'good' | 'warn' | 'info' }
export type Objective = { id: string; title: string; detail: string; progress: number; done: boolean }

export type CityState = {
  version: 1
  cityName: string
  difficulty: Difficulty
  map: StartingMap
  mode: CityMode
  population: number
  budget: number
  pollution: number
  happiness: number
  waterSupply: number
  waterDemand: number
  forestCover: number
  environmentalIndex: number
  day: number
  buildings: Building[]
  terrain: Record<string, number>
  policies: Record<PolicyKey, boolean>
  events: CityEvent[]
  objectives: Objective[]
}

export type BuildingSpec = {
  type: BuildingType
  label: string
  short: string
  description: string
  cost: number
  upkeep: number
  income: number
  population: number
  pollution: number
  water: number
  happiness: number
  forest: number
  category: 'city' | 'nature' | 'water'
  accent: string
}

export const BUILDINGS: Record<BuildingType, BuildingSpec> = {
  civic: { type: 'civic', label: 'Sustainability Hub', short: 'HUB', description: 'Civic anchor for a resilient coastal city.', cost: 0, upkeep: 1200, income: 0, population: 0, pollution: -2, water: 4, happiness: 3, forest: 0, category: 'city', accent: '#42d6a1' },
  residential: { type: 'residential', label: 'Eco Residences', short: 'HOME', description: 'Compact housing with breezeways and rooftop gardens.', cost: 72000, upkeep: 250, income: 2600, population: 160, pollution: 1, water: 6, happiness: 0, forest: 0, category: 'city', accent: '#81c784' },
  commercial: { type: 'commercial', label: 'Market Arcade', short: 'SHOP', description: 'A mixed-use market that creates local jobs.', cost: 98000, upkeep: 340, income: 4800, population: 0, pollution: 1, water: 4, happiness: 2, forest: 0, category: 'city', accent: '#f1b86b' },
  industrial: { type: 'industrial', label: 'Clean Industry', short: 'WORK', description: 'Jobs and revenue, with a clear environmental trade-off.', cost: 128000, upkeep: 700, income: 7200, population: 0, pollution: 8, water: 8, happiness: -2, forest: -1, category: 'city', accent: '#e88968' },
  road: { type: 'road', label: 'Complete Street', short: 'ROAD', description: 'Low-speed road that connects neighborhoods and services.', cost: 18000, upkeep: 80, income: 0, population: 0, pollution: 0.4, water: 0, happiness: 1, forest: 0, category: 'city', accent: '#8d9aa8' },
  school: { type: 'school', label: 'Climate School', short: 'LEARN', description: 'Education improves long-term resilience and happiness.', cost: 88000, upkeep: 1100, income: 0, population: 0, pollution: 0, water: 5, happiness: 7, forest: 0, category: 'city', accent: '#75b6e8' },
  hospital: { type: 'hospital', label: 'Coastal Clinic', short: 'CARE', description: 'Health services make a growing city feel safe.', cost: 118000, upkeep: 1500, income: 0, population: 0, pollution: 0, water: 8, happiness: 8, forest: 0, category: 'city', accent: '#f5f1e7' },
  renewable: { type: 'renewable', label: 'Solar Canopy', short: 'SOLAR', description: 'Clean power that offsets pollution from growth.', cost: 112000, upkeep: 420, income: 1200, population: 0, pollution: -4, water: 0, happiness: 2, forest: 0, category: 'city', accent: '#5fd4e8' },
  treatment: { type: 'treatment', label: 'Water Treatment', short: 'TREAT', description: 'Expands water capacity and protects the shoreline.', cost: 138000, upkeep: 650, income: 0, population: 0, pollution: -2, water: 48, happiness: 3, forest: 0, category: 'water', accent: '#74c8e8' },
  water: { type: 'water', label: 'Rain Garden', short: 'WATER', description: 'A small water system that captures monsoon runoff.', cost: 46000, upkeep: 180, income: 0, population: 0, pollution: -1, water: 26, happiness: 2, forest: 0.4, category: 'water', accent: '#5bb9cf' },
  tree: { type: 'tree', label: 'Native Tree', short: 'TREE', description: 'Adds shade, habitat and forest cover.', cost: 12000, upkeep: 30, income: 0, population: 0, pollution: -1, water: 0, happiness: 1, forest: 0.8, category: 'nature', accent: '#42d6a1' },
  park: { type: 'park', label: 'Pocket Park', short: 'PARK', description: 'A green public space that lifts happiness.', cost: 38000, upkeep: 90, income: 0, population: 0, pollution: -2, water: 0, happiness: 4, forest: 1.6, category: 'nature', accent: '#67d18c' },
  forest: { type: 'forest', label: 'Forest Restoration', short: 'RESTORE', description: 'Restores a larger patch of native coastal forest.', cost: 64000, upkeep: 120, income: 0, population: 0, pollution: -4, water: 0, happiness: 3, forest: 4.2, category: 'nature', accent: '#2bbf86' },
  cleanup: { type: 'cleanup', label: 'Clean-up Site', short: 'CLEAN', description: 'Remediates a polluted parcel for future use.', cost: 52000, upkeep: 70, income: 0, population: 0, pollution: -5, water: 0, happiness: 2, forest: 0.5, category: 'nature', accent: '#a3db77' },
  coastal: { type: 'coastal', label: 'Coastal Buffer', short: 'COAST', description: 'Protects dunes and mangroves from storm surge.', cost: 78000, upkeep: 140, income: 0, population: 0, pollution: -2, water: 0, happiness: 4, forest: 2.2, category: 'nature', accent: '#3ec4c9' },
}

const POLICY_COST: Record<PolicyKey, number> = { renewable: 7500, waste: 6500, water: 5000, transport: 8500, protection: 7000 }
const POLICY_LABEL: Record<PolicyKey, string> = { renewable: 'Renewable incentives', waste: 'Circular waste', water: 'Water conservation', transport: 'Public transport', protection: 'Coastal protection' }
let eventId = 0

const clamp = (value: number, min = 0, max = 100): number => Math.min(max, Math.max(min, value))
const keyFor = (x: number, z: number): string => `${x},${z}`
const count = (state: CityState, type: BuildingType): number => state.buildings.filter(b => b.type === type).length
const sum = (state: CityState, key: keyof BuildingSpec): number => state.buildings.reduce((total, b) => total + Number(BUILDINGS[b.type][key] ?? 0), 0)

function addEvent(state: CityState, title: string, body: string, tone: CityEvent['tone']): void {
  state.events.unshift({ id: `event-${Date.now()}-${eventId++}`, day: Math.floor(state.day), title, body, tone })
  state.events = state.events.slice(0, 6)
}

function makeObjectives(state: CityState): Objective[] {
  return [
    { id: 'population', title: 'Welcome 1,000 residents', detail: 'Grow housing and services without losing the coast.', progress: clamp(state.population / 1000), done: state.population >= 1000 },
    { id: 'happiness', title: 'Keep happiness above 70%', detail: 'Services, parks and clean air all matter.', progress: clamp(state.happiness / 70), done: state.happiness >= 70 },
    { id: 'pollution', title: 'Bring pollution below 18', detail: 'Balance industry with clean power and nature.', progress: clamp((42 - state.pollution) / 24), done: state.pollution <= 18 },
    { id: 'forest', title: 'Restore forest cover to 80%', detail: 'Trees are infrastructure for heat and storms.', progress: clamp(state.forestCover / 80), done: state.forestCover >= 80 },
    { id: 'index', title: 'Reach a sustainable index of 70', detail: 'A healthy city keeps every system in view.', progress: clamp(state.environmentalIndex / 70), done: state.environmentalIndex >= 70 },
    { id: 'budget', title: 'Maintain a positive budget', detail: 'Keep the civic ledger in the green.', progress: state.budget > 0 ? 1 : 0, done: state.budget > 0 },
  ]
}

export function createCity(cityName: string, difficulty: Difficulty, map: StartingMap, mode: CityMode): CityState {
  const startingBuildings: Building[] = [
    { id: 'civic-1', type: 'civic', x: 0, z: 0, name: 'Sustainability Hub', placedAt: Date.now() },
    { id: 'res-1', type: 'residential', x: -2, z: -1, name: 'Eco Residences', placedAt: Date.now() },
    { id: 'market-1', type: 'commercial', x: 2, z: -1, name: 'Market Arcade', placedAt: Date.now() },
    { id: 'school-1', type: 'school', x: -3, z: 1, name: 'Climate School', placedAt: Date.now() },
    { id: 'park-1', type: 'park', x: 1, z: 2, name: 'Pocket Park', placedAt: Date.now() },
    { id: 'solar-1', type: 'renewable', x: 3, z: 2, name: 'Solar Canopy', placedAt: Date.now() },
    { id: 'water-1', type: 'water', x: -4, z: 2, name: 'Rain Garden', placedAt: Date.now() },
    { id: 'road-1', type: 'road', x: -1, z: 0, name: 'Complete Street', placedAt: Date.now() },
    { id: 'road-2', type: 'road', x: 1, z: 0, name: 'Complete Street', placedAt: Date.now() },
    { id: 'road-3', type: 'road', x: 0, z: -1, name: 'Complete Street', placedAt: Date.now() },
  ]
  const difficultyFactor = difficulty === 'easy' ? 1.12 : difficulty === 'hard' ? 0.84 : 1
  const state: CityState = {
    version: 1,
    cityName: cityName.trim() || 'Visakhapatnam',
    difficulty,
    map,
    mode,
    population: 500,
    budget: Math.round(500000 * difficultyFactor),
    pollution: 22,
    happiness: 60,
    waterSupply: 94,
    waterDemand: 42,
    forestCover: 70,
    environmentalIndex: 64,
    day: 1,
    buildings: startingBuildings,
    terrain: {},
    policies: { renewable: false, waste: false, water: false, transport: false, protection: false },
    events: [],
    objectives: [],
  }
  addEvent(state, 'The first tide is in', `${state.cityName} is ready for a more resilient future.`, 'good')
  state.objectives = makeObjectives(state)
  return state
}

export function cloneCity(state: CityState): CityState {
  return JSON.parse(JSON.stringify(state)) as CityState
}

export function isInside(x: number, z: number): boolean {
  return x >= -6 && x <= 6 && z >= -5 && z <= 6
}

export function occupied(state: CityState, x: number, z: number): Building | undefined {
  return state.buildings.find(b => b.x === x && b.z === z)
}

export function placeBuilding(state: CityState, type: BuildingType, x: number, z: number): { ok: true; state: CityState; building: Building } | { ok: false; message: string } {
  const spec = BUILDINGS[type]
  if (!isInside(x, z)) return { ok: false, message: 'That parcel is outside the planned city edge.' }
  if (occupied(state, x, z)) return { ok: false, message: 'This parcel is already occupied. Choose another tile.' }
  if (state.budget < spec.cost) return { ok: false, message: `You need ${formatMoney(spec.cost)} for ${spec.label}.` }
  const next = cloneCity(state)
  const building: Building = { id: `${type}-${Date.now()}-${next.buildings.length}`, type, x, z, name: spec.label, placedAt: Date.now() }
  next.buildings.push(building)
  next.budget -= spec.cost
  next.objectives = makeObjectives(next)
  addEvent(next, `${spec.label} placed`, `${spec.description} Construction cost ${formatMoney(spec.cost)}.`, spec.category === 'nature' ? 'good' : 'info')
  return { ok: true, state: next, building }
}

export function terraform(state: CityState, x: number, z: number, direction: 1 | -1): { ok: true; state: CityState } | { ok: false; message: string } {
  if (!isInside(x, z)) return { ok: false, message: 'Terraforming is limited to the buildable coast.' }
  const cost = 3500
  if (state.budget < cost) return { ok: false, message: `You need ${formatMoney(cost)} to move earth.` }
  const next = cloneCity(state)
  const key = keyFor(x, z)
  next.terrain[key] = clamp((next.terrain[key] ?? 0) + direction, -2, 2)
  next.budget -= cost
  addEvent(next, direction > 0 ? 'A new rise is taking shape' : 'A lower terrace opens up', `Terrain work completed at parcel ${x}, ${z}.`, 'info')
  return { ok: true, state: next }
}

export function togglePolicy(state: CityState, policy: PolicyKey): { ok: true; state: CityState; enabled: boolean } | { ok: false; message: string } {
  const next = cloneCity(state)
  const enabling = !next.policies[policy]
  if (enabling && next.budget < POLICY_COST[policy]) return { ok: false, message: `You need ${formatMoney(POLICY_COST[policy])} to enact ${POLICY_LABEL[policy]}.` }
  if (enabling) next.budget -= POLICY_COST[policy]
  next.policies[policy] = enabling
  addEvent(next, enabling ? `${POLICY_LABEL[policy]} enacted` : `${POLICY_LABEL[policy]} paused`, enabling ? 'The city ledger now includes this policy.' : 'The policy can be reactivated when conditions improve.', enabling ? 'good' : 'warn')
  next.objectives = makeObjectives(next)
  return { ok: true, state: next, enabled: enabling }
}

export function simulate(state: CityState, seconds: number): CityState {
  if (seconds <= 0) return state
  const next = cloneCity(state)
  const days = seconds / 6
  next.day += days
  const residential = count(next, 'residential')
  const commercial = count(next, 'commercial')
  const industrial = count(next, 'industrial')
  const school = count(next, 'school')
  const hospital = count(next, 'hospital')
  const renewable = count(next, 'renewable')
  const treatment = count(next, 'treatment')
  const trees = count(next, 'tree')
  const parks = count(next, 'park')
  const restored = count(next, 'forest')
  const coast = count(next, 'coastal')
  const cleanup = count(next, 'cleanup')
  const waterWorks = count(next, 'water')
  const greenPressure = trees * 0.9 + parks * 2.2 + restored * 4 + coast * 2.2 + cleanup * 2.5
  const policyRelief = (next.policies.waste ? 4 : 0) + (next.policies.protection ? 4 : 0) + (next.policies.renewable ? 3 : 0)
  next.pollution = clamp(22 + industrial * 7 + residential * 0.4 - greenPressure - renewable * 1.4 - treatment * 1.2 - policyRelief, 4, 100)
  const capacity = 100 + treatment * 50 + waterWorks * 28
  next.waterDemand = Math.max(20, next.population / 14 + residential * 2 + commercial * 3 + industrial * 7 + school * 2 + hospital * 3)
  next.waterSupply = clamp((capacity / next.waterDemand) * 100, 0, 100)
  const serviceScore = Math.min(12, school * 2.5 + hospital * 3 + count(next, 'civic'))
  next.happiness = clamp(60 + serviceScore * 1.3 + parks * 1.3 + trees * 0.12 + (next.policies.transport ? 3 : 0) + (next.policies.water ? 2 : 0) - next.pollution * 0.23 + (next.waterSupply - 70) * 0.08, 0, 100)
  next.forestCover = clamp(70 + trees * 0.8 + parks * 1.6 + restored * 4.1 + coast * 2 - industrial * 0.6, 0, 100)
  next.environmentalIndex = clamp(30 + next.happiness * 0.3 + next.forestCover * 0.44 + next.waterSupply * 0.12 - next.pollution * 0.46 + renewable * 1.3 + (next.policies.protection ? 4 : 0), 0, 100)
  const housing = 500 + residential * 160
  const growth = Math.max(-1, Math.min(8, (housing - next.population) * 0.002 + (next.happiness - 50) * 0.025 - next.pollution * 0.008))
  next.population = Math.max(100, Math.round(next.population + growth * days))
  const income = 3500 + commercial * 4800 + industrial * 7200 + next.population * 1.8 + (next.policies.renewable ? 700 : 0)
  const upkeep = 1200 + sum(next, 'upkeep') + (next.policies.waste ? 500 : 0) + (next.policies.water ? 380 : 0) + (next.policies.transport ? 900 : 0) + (next.policies.protection ? 520 : 0)
  next.budget += Math.round((income - upkeep) * days)
  if (next.waterSupply < 65 && state.waterSupply >= 65) addEvent(next, 'Water watch activated', 'Demand is outpacing supply. Add treatment or rain gardens before the next monsoon.', 'warn')
  if (next.pollution < 18 && state.pollution >= 18) addEvent(next, 'Air quality target reached', 'The city is now below the pollution objective.', 'good')
  if (next.happiness >= 70 && state.happiness < 70) addEvent(next, 'Residents feel the difference', 'Happiness crossed 70%. Keep investing in daily life.', 'good')
  next.objectives = makeObjectives(next)
  return next
}

export function formatMoney(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

export function policyCost(policy: PolicyKey): number {
  return POLICY_COST[policy]
}

export function policyLabel(policy: PolicyKey): string {
  return POLICY_LABEL[policy]
}
