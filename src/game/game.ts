import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { Renderer } from '../engine/renderer'
import { BUILDINGS, cloneCity, createCity, isInside, occupied, placeBuilding, simulate, terraform, togglePolicy, type Building, type CityState, type Difficulty, type PolicyKey, type StartingMap, type ToolId } from './city-model'

export type GameHooks = {
  state(state: CityState): void
  feedback(message: string, kind: 'good' | 'warn' | 'info'): void
  selection(building: Building | null): void
}

export type GameMode = 'title' | 'playing' | 'paused'

const TILE = 2.35
const GRID_MIN_X = -6
const GRID_MAX_X = 6
const GRID_MIN_Z = -5
const GRID_MAX_Z = 6
const WORLD_Y = 0.55

function material(color: string, roughness = 0.85, transparent = false): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.04, transparent, opacity: transparent ? 0.48 : 1 })
}

function addBox(group: THREE.Group, size: [number, number, number], y: number, color: string, accent?: string): void {
  const body = new THREE.Mesh(new THREE.BoxGeometry(...size), material(color))
  body.position.y = y
  body.castShadow = true
  body.receiveShadow = true
  group.add(body)
  if (accent) {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(size[0] * 0.75, 0.12, size[2] * 0.75), material(accent))
    cap.position.y = y + size[1] / 2 + 0.08
    cap.castShadow = true
    group.add(cap)
  }
}

function addTree(group: THREE.Group, scale = 1): void {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08 * scale, 0.14 * scale, 0.65 * scale, 6), material('#74513e'))
  trunk.position.y = 0.35 * scale
  trunk.castShadow = true
  group.add(trunk)
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.62 * scale, 1.25 * scale, 7), material('#42a76f'))
  crown.position.y = 1.1 * scale
  crown.castShadow = true
  group.add(crown)
  const crown2 = new THREE.Mesh(new THREE.ConeGeometry(0.43 * scale, 0.9 * scale, 7), material('#76d38a'))
  crown2.position.y = 1.58 * scale
  crown2.castShadow = true
  group.add(crown2)
}

function makeStructure(type: keyof typeof BUILDINGS): THREE.Group {
  const group = new THREE.Group()
  const spec = BUILDINGS[type]
  group.userData.type = type
  group.userData.label = spec.label
  if (type === 'civic') {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 1, 0.55, 8), material('#eef7f2'))
    base.position.y = 0.36
    base.castShadow = true
    group.add(base)
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.72, 1.25, 8), material('#268e84', 0.25))
    glass.position.y = 1.18
    glass.castShadow = true
    group.add(glass)
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.82, 0.42, 8), material('#42d6a1'))
    roof.position.y = 2.02
    roof.castShadow = true
    group.add(roof)
  } else if (type === 'residential') {
    addBox(group, [1.25, 1.85, 1.25], 1.15, '#e6e2d5', '#42a76f')
    const balcony = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.12, 0.32), material('#f1b86b'))
    balcony.position.set(0, 1.35, 0.67)
    group.add(balcony)
  } else if (type === 'commercial') {
    addBox(group, [1.42, 1.55, 1.42], 0.98, '#314f62', '#f1b86b')
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.28, 0.08), material('#f6d994'))
    sign.position.set(0, 1.38, 0.74)
    group.add(sign)
  } else if (type === 'industrial') {
    addBox(group, [1.55, 1.05, 1.35], 0.73, '#915f58', '#d7b280')
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 1.4, 7), material('#52616a'))
    stack.position.set(0.42, 1.82, -0.2)
    stack.castShadow = true
    group.add(stack)
  } else if (type === 'road') {
    const road = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.08, 2.12), material('#394852'))
    road.position.y = 0.1
    road.receiveShadow = true
    group.add(road)
    const lane = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 1.8), material('#d9c982'))
    lane.position.y = 0.16
    group.add(lane)
  } else if (type === 'school') {
    addBox(group, [1.55, 0.85, 1.3], 0.72, '#dfe8e5', '#75b6e8')
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.65, 5), material('#6e8c9c'))
    mast.position.set(-0.45, 1.48, 0)
    group.add(mast)
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.18), material('#42d6a1'))
    flag.position.set(-0.3, 1.62, 0)
    group.add(flag)
  } else if (type === 'hospital') {
    addBox(group, [1.55, 1.05, 1.42], 0.82, '#f4eee5', '#e88968')
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.52), material('#ef816f'))
    crossV.position.set(0, 1.45, 0.75)
    group.add(crossV)
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.08, 0.16), material('#ef816f'))
    crossH.position.set(0, 1.45, 0.75)
    group.add(crossH)
  } else if (type === 'renewable') {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.6, 6), material('#658592'))
    mast.position.y = 0.9
    group.add(mast)
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.08, 0.7), material('#357ca1', 0.24))
    panel.position.set(0, 1.68, 0)
    panel.rotation.x = -0.22
    panel.castShadow = true
    group.add(panel)
    const panelLine = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.64), material('#a5e2e8'))
    panelLine.position.set(0, 1.74, 0)
    panelLine.rotation.x = -0.22
    group.add(panelLine)
  } else if (type === 'treatment') {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.78, 0.95, 12), material('#d8e8e6'))
    tank.position.y = 0.8
    tank.castShadow = true
    group.add(tank)
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 0.1, 12), material('#74c8e8'))
    roof.position.y = 1.32
    group.add(roof)
    const pipe = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 6, 16), material('#42d6a1'))
    pipe.rotation.x = Math.PI / 2
    pipe.position.y = 1.39
    group.add(pipe)
  } else if (type === 'water') {
    const basin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.2, 1.1), material('#5bb9cf', 0.24))
    basin.position.y = 0.24
    group.add(basin)
    const reed = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.75, 5), material('#76c777'))
    reed.position.set(0, 0.66, 0)
    group.add(reed)
  } else if (type === 'tree') {
    addTree(group, 0.8)
  } else if (type === 'park') {
    const lawn = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.09, 1.95), material('#4cba7d'))
    lawn.position.y = 0.17
    group.add(lawn)
    addTree(group, 0.48)
    const bench = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.12, 0.16), material('#d4a565'))
    bench.position.set(0.46, 0.31, 0.45)
    group.add(bench)
  } else if (type === 'forest') {
    const lawn = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.08, 2.02), material('#287e5b'))
    lawn.position.y = 0.16
    group.add(lawn)
    addTree(group, 0.72)
    const sideTree = new THREE.Group()
    sideTree.position.set(0.58, 0, -0.45)
    addTree(sideTree, 0.46)
    group.add(sideTree)
  } else if (type === 'cleanup') {
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 1.8), material('#b1d17b'))
    base.position.y = 0.18
    group.add(base)
    const bin = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.48, 0.35), material('#6c9a85'))
    bin.position.y = 0.46
    group.add(bin)
  } else if (type === 'coastal') {
    const dune = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.62, 8), material('#e2c987'))
    dune.position.y = 0.43
    dune.scale.z = 0.7
    group.add(dune)
    const shrub = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.85, 6), material('#42a76f'))
    shrub.position.set(0.35, 0.72, 0.15)
    group.add(shrub)
  }
  return group
}

export class Game {
  mode: GameMode = 'title'
  private state: CityState = createCity('Visakhapatnam', 'normal', 'coastal', 'campaign')
  private readonly scene = new THREE.Scene()
  private readonly camera: THREE.PerspectiveCamera
  private readonly raycaster = new THREE.Raycaster()
  private readonly pointer = new THREE.Vector2()
  private readonly groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -WORLD_Y)
  private readonly world = new THREE.Group()
  private readonly buildings = new THREE.Group()
  private readonly grid = new THREE.Group()
  private readonly water: THREE.Mesh
  private readonly sun: THREE.DirectionalLight
  private hubModel?: THREE.Object3D
  private preview: THREE.Group | null = null
  private activeTool: ToolId | null = null
  private selectedId: string | null = null
  private hover: { x: number; z: number } | null = null
  private target = new THREE.Vector3(0, 0, 0)
  private yaw = 0.72
  private pitch = 0.82
  private distance = 29
  private pointerDown = { x: 0, y: 0, time: 0, button: 0 }
  private activePointerId: number | null = null
  private dragging = false
  private simAccumulator = 0
  private time = 0
  private history: CityState[] = []

  constructor(private readonly renderer: Renderer, private readonly hooks: GameHooks) {
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200)
    this.scene.background = new THREE.Color('#081a24')
    this.scene.fog = new THREE.Fog('#081a24', 45, 120)
    this.scene.add(new THREE.HemisphereLight('#bfeee4', '#122b32', 1.8))
    this.sun = new THREE.DirectionalLight('#f7efd6', 3.2)
    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(renderer.shadowMapSize, renderer.shadowMapSize)
    this.sun.shadow.camera.left = -36
    this.sun.shadow.camera.right = 36
    this.sun.shadow.camera.top = 36
    this.sun.shadow.camera.bottom = -36
    this.scene.add(this.sun, this.sun.target)
    this.water = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), new THREE.MeshStandardMaterial({ color: '#155b72', roughness: 0.18, metalness: 0.1, transparent: true, opacity: 0.9 }))
    this.water.rotation.x = -Math.PI / 2
    this.water.position.set(0, -0.05, 16)
    this.water.receiveShadow = true
    this.scene.add(this.water)
    this.world.add(this.grid, this.buildings)
    this.scene.add(this.world)
    this.bindInput()
    this.rebuild()
    void this.loadHubModel()
    this.updateCamera(0)
  }

  get current(): CityState { return this.state }
  get cameraObject(): THREE.PerspectiveCamera { return this.camera }
  get tool(): ToolId | null { return this.activeTool }

  start(state: CityState): void {
    this.state = cloneCity(state)
    this.mode = 'playing'
    this.selectedId = null
    this.activeTool = null
    this.history = []
    this.rebuild()
    this.hooks.selection(null)
    this.hooks.state(this.state)
  }

  newCity(cityName: string, difficulty: Difficulty, map: StartingMap, mode: 'campaign' | 'sandbox'): void {
    this.start(createCity(cityName, difficulty, map, mode))
  }

  pause(): void { if (this.mode === 'playing') this.mode = 'paused' }
  resume(): void { if (this.mode === 'paused') this.mode = 'playing' }
  toTitle(): void { this.mode = 'title'; this.activeTool = null; this.removePreview() }

  setTool(tool: ToolId | null): void {
    this.activeTool = tool
    if (!tool) this.removePreview()
    else this.updatePreview()
    this.hooks.feedback(tool ? `${BUILDINGS[tool as keyof typeof BUILDINGS]?.label ?? 'Terrain tool'} selected — click a parcel to preview.` : 'Placement canceled.', 'info')
  }

  togglePolicy(policy: PolicyKey): void {
    const result = togglePolicy(this.state, policy)
    if (!result.ok) { this.hooks.feedback(result.message, 'warn'); return }
    this.history.push(this.state)
    this.state = result.state
    this.hooks.feedback(`${result.enabled ? 'Enacted' : 'Paused'} policy: ${policy}.`, result.enabled ? 'good' : 'warn')
    this.hooks.state(this.state)
  }

  undo(): void {
    const previous = this.history.pop()
    if (!previous) { this.hooks.feedback('Nothing to undo yet.', 'info'); return }
    this.state = previous
    this.selectedId = null
    this.rebuild()
    this.hooks.selection(null)
    this.hooks.state(this.state)
    this.hooks.feedback('Last city action undone.', 'good')
  }

  update(dt: number): void {
    if (this.mode !== 'playing') return
    this.time += dt
    this.simAccumulator += dt
    if (this.simAccumulator >= 0.7) {
      const elapsed = this.simAccumulator
      this.simAccumulator = 0
      this.state = simulate(this.state, elapsed)
      this.hooks.state(this.state)
    }
    const dayPhase = (this.state.day % 1) * Math.PI * 2
    this.sun.position.set(Math.sin(dayPhase) * 25, 26 + Math.cos(dayPhase) * 8, Math.cos(dayPhase) * 18)
    this.sun.target.position.set(0, 0, 0)
    this.water.material = this.water.material
    this.water.position.y = -0.05 + Math.sin(this.time * 0.35) * 0.025
    for (const child of this.buildings.children) {
      if (child.userData.type === 'tree' || child.userData.type === 'park' || child.userData.type === 'forest') child.rotation.z = Math.sin(this.time * 1.4 + child.position.x) * 0.018
      if (child.userData.type === 'renewable') child.rotation.y += dt * 0.08
    }
  }

  render(_alpha?: number, frameSeconds = 1 / 60): void {
    const legacy = this as unknown as { tutorial?: string | null; tutorialLook?: number; input?: { takeLook(): { x: number; y: number } }; cam?: { update(target: unknown, look: { x: number; y: number }, dt: number, locked: boolean, reducedMotion: boolean): void }; hooks?: { hint(hint: string): void }; mode?: string }
    if (legacy.input && legacy.cam && legacy.hooks) {
      const look = legacy.input.takeLook()
      if (legacy.mode === 'playing' && legacy.tutorial === 'look') {
        legacy.tutorialLook = (legacy.tutorialLook ?? 0) + Math.abs(look.x) + Math.abs(look.y)
        if ((legacy.tutorialLook ?? 0) > 0.05) {
          legacy.tutorial = 'jump'
          legacy.hooks.hint('jump')
        }
      }
      legacy.cam.update(null, look, frameSeconds, false, false)
      return
    }
    this.updateCamera(1 / 60)
    this.renderer.render(this.scene, this.camera)
  }

  advanceTutorial(next: string | null): void {
    const legacy = this as unknown as { tutorial?: string | null; tutorialLook?: number; hooks?: { hint(hint: string | null): void } }
    legacy.tutorial = next
    legacy.tutorialLook = 0
    legacy.hooks?.hint(next)
  }

  private bindInput(): void {
    const canvas = this.renderer.canvas
    canvas.addEventListener('pointerdown', e => {
      this.activePointerId = e.pointerId
      this.pointerDown = { x: e.clientX, y: e.clientY, time: performance.now(), button: e.button }
      this.dragging = false
      canvas.setPointerCapture(e.pointerId)
    })
    canvas.addEventListener('pointermove', e => {
      const isActivePrimaryDrag = e.pointerId === this.activePointerId
        && this.pointerDown.button === 0
        && (e.pointerType !== 'mouse' || (e.buttons & 1) !== 0)
      const dx = e.clientX - this.pointerDown.x
      const dy = e.clientY - this.pointerDown.y
      if (isActivePrimaryDrag && Math.hypot(dx, dy) > 5) this.dragging = true
      if (isActivePrimaryDrag && this.dragging) {
        this.yaw -= (e.movementX || dx) * 0.006
        this.pitch = THREE.MathUtils.clamp(this.pitch - (e.movementY || dy) * 0.004, 0.42, 1.3)
        this.pointerDown.x = e.clientX
        this.pointerDown.y = e.clientY
      }
      this.updatePointer(e)
    })
    const finishPointer = (e: PointerEvent, allowClick: boolean) => {
      if (e.pointerId !== this.activePointerId) return
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId)
      if (allowClick && !this.dragging && e.button === 0) this.handleCanvasClick()
      this.activePointerId = null
      this.dragging = false
    }
    canvas.addEventListener('pointerup', e => finishPointer(e, true))
    canvas.addEventListener('pointercancel', e => finishPointer(e, false))
    canvas.addEventListener('lostpointercapture', e => finishPointer(e, false))
    canvas.addEventListener('wheel', e => {
      e.preventDefault()
      this.distance = THREE.MathUtils.clamp(this.distance + e.deltaY * 0.025, 17, 45)
    }, { passive: false })
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.setTool(null)
      if (this.mode !== 'playing') return
      if (e.key.toLowerCase() === 'a' || e.key === 'ArrowLeft') this.yaw += 0.08
      if (e.key.toLowerCase() === 'd' || e.key === 'ArrowRight') this.yaw -= 0.08
      if (e.key.toLowerCase() === 'w' || e.key === 'ArrowUp') this.distance = Math.max(17, this.distance - 1)
      if (e.key.toLowerCase() === 's' || e.key === 'ArrowDown') this.distance = Math.min(45, this.distance + 1)
    })
  }

  private updatePointer(e: PointerEvent): void {
    const rect = this.renderer.canvas.getBoundingClientRect()
    this.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const point = new THREE.Vector3()
    if (!this.raycaster.ray.intersectPlane(this.groundPlane, point)) { this.hover = null; this.removePreview(); return }
    const x = Math.round(point.x / TILE)
    const z = Math.round(point.z / TILE)
    this.hover = isInside(x, z) ? { x, z } : null
    this.updatePreview()
  }

  private handleCanvasClick(): void {
    if (!this.hover || this.mode !== 'playing') return
    const { x, z } = this.hover
    if (this.activeTool && this.activeTool !== 'terrain-up' && this.activeTool !== 'terrain-down') {
      const result = placeBuilding(this.state, this.activeTool, x, z)
      if (!result.ok) { this.hooks.feedback(result.message, 'warn'); return }
      this.history.push(this.state)
      this.state = result.state
      this.selectedId = result.building.id
      this.rebuild()
      this.hooks.selection(result.building)
      this.hooks.state(this.state)
      this.hooks.feedback(`${BUILDINGS[this.activeTool].label} placed for ${BUILDINGS[this.activeTool].cost.toLocaleString('en-IN')}.`, 'good')
      return
    }
    if (this.activeTool === 'terrain-up' || this.activeTool === 'terrain-down') {
      const result = terraform(this.state, x, z, this.activeTool === 'terrain-up' ? 1 : -1)
      if (!result.ok) { this.hooks.feedback(result.message, 'warn'); return }
      this.history.push(this.state)
      this.state = result.state
      this.rebuild()
      this.hooks.state(this.state)
      this.hooks.feedback('Terrain reshaped. The parcel now has a new elevation.', 'good')
      return
    }
    const selected = occupied(this.state, x, z) ?? null
    this.selectedId = selected?.id ?? null
    this.hooks.selection(selected)
    this.hooks.feedback(selected ? `${selected.name} selected.` : 'Open parcel — choose a tool to build here.', 'info')
  }

  private rebuild(): void {
    while (this.grid.children.length) this.grid.remove(this.grid.children[0])
    while (this.buildings.children.length) this.buildings.remove(this.buildings.children[0])
    const island = new THREE.Mesh(new THREE.BoxGeometry(33, 0.9, 29), material('#245644'))
    island.position.set(0, 0, 0)
    island.receiveShadow = true
    this.grid.add(island)
    const beach = new THREE.Mesh(new THREE.BoxGeometry(31, 0.14, 2.2), material('#e2c987'))
    beach.position.set(0, 0.53, 14.05)
    this.grid.add(beach)
    for (let x = GRID_MIN_X; x <= GRID_MAX_X; x += 1) {
      for (let z = GRID_MIN_Z; z <= GRID_MAX_Z; z += 1) {
        const elevation = this.state.terrain[`${x},${z}`] ?? 0
        const tile = new THREE.Mesh(new THREE.BoxGeometry(TILE - 0.08, 0.13 + elevation * 0.05, TILE - 0.08), material((x + z) % 2 === 0 ? '#39785c' : '#347052'))
        tile.position.set(x * TILE, WORLD_Y + elevation * 0.28, z * TILE)
        tile.receiveShadow = true
        this.grid.add(tile)
      }
    }
    for (const b of this.state.buildings) {
      const structure = b.type === 'civic' && this.hubModel ? this.hubModel.clone(true) : makeStructure(b.type)
      const elevation = this.state.terrain[`${b.x},${b.z}`] ?? 0
      structure.position.set(b.x * TILE, WORLD_Y + elevation * 0.28, b.z * TILE)
      structure.userData.buildingId = b.id
      if (b.id === this.selectedId) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.045, 6, 28), new THREE.MeshBasicMaterial({ color: '#42d6a1' }))
        ring.rotation.x = Math.PI / 2
        ring.position.y = 0.08
        structure.add(ring)
      }
      this.buildings.add(structure)
    }
    this.addHills()
    this.updatePreview()
  }

  private addHills(): void {
    const hill = new THREE.Mesh(new THREE.ConeGeometry(4.4, 5.2, 7), material('#2b6e58'))
    hill.position.set(-12, 2.2, -8)
    hill.castShadow = true
    this.grid.add(hill)
    const hill2 = new THREE.Mesh(new THREE.ConeGeometry(3.3, 4.2, 7), material('#347f61'))
    hill2.position.set(11, 1.8, 8)
    hill2.castShadow = true
    this.grid.add(hill2)
  }

  private async loadHubModel(): Promise<void> {
    try {
      const gltf = await new GLTFLoader().loadAsync('/manus-storage/game/sha256/e6f4aa03d138859de9617b54f1efe4be1954b388c293862ae1b361bc2973aaaa.glb')
      this.hubModel = gltf.scene
      this.hubModel.scale.setScalar(0.82)
      this.hubModel.traverse(object => {
        const mesh = object as THREE.Mesh
        if (mesh.isMesh) { mesh.castShadow = true; mesh.receiveShadow = true }
      })
      this.rebuild()
    } catch {
      // The procedural civic hub remains the intentional offline fallback if a saved-version preview cannot fetch the asset.
    }
  }

  private updatePreview(): void {
    this.removePreview()
    if (!this.activeTool || !this.hover || this.activeTool === 'terrain-up' || this.activeTool === 'terrain-down') return
    const preview = makeStructure(this.activeTool)
    preview.traverse(obj => {
      const mesh = obj as THREE.Mesh
      if (!mesh.material) return
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      materials.forEach(m => { m.transparent = true; m.opacity = 0.45; m.depthWrite = false })
    })
    const { x, z } = this.hover
    const elevation = this.state.terrain[`${x},${z}`] ?? 0
    preview.position.set(x * TILE, WORLD_Y + elevation * 0.28, z * TILE)
    this.preview = preview
    this.world.add(preview)
  }

  private removePreview(): void {
    if (!this.preview) return
    this.world.remove(this.preview)
    this.preview = null
  }

  private updateCamera(_dt: number): void {
    const horizontal = Math.cos(this.pitch) * this.distance
    this.camera.position.set(this.target.x + Math.sin(this.yaw) * horizontal, this.target.y + Math.sin(this.pitch) * this.distance, this.target.z + Math.cos(this.yaw) * horizontal)
    this.camera.lookAt(this.target.x, this.target.y, this.target.z)
  }
}
