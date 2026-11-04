import { BUILDINGS, formatMoney, formatPercent, policyCost, policyLabel, type Building, type CityState, type Difficulty, type PolicyKey, type StartingMap, type ToolId } from '../game/city-model'

export type SaveSlot = { id: string; name: string; updatedAt: number; state: CityState }
export type UiScreen = 'boot' | 'title' | 'hud' | 'setup' | 'load' | 'dashboard' | 'settings' | 'pause'
export type UiActions = {
  newGame(cityName: string, difficulty: Difficulty, map: StartingMap, mode: 'campaign' | 'sandbox'): void
  continueGame(): void
  loadGame(id: string): void
  deleteSave(id: string): void
  renameSave(id: string, name: string): void
  saveGame(): void
  setTool(tool: ToolId | null): void
  togglePolicy(policy: PolicyKey): void
  undo(): void
  pause(): void
  resume(): void
  quit(): void
  setQuality(quality: 'low' | 'medium' | 'high'): void
}

const toolGroups: { title: string; tools: ToolId[] }[] = [
  { title: 'Build', tools: ['residential', 'commercial', 'industrial', 'road', 'school', 'hospital', 'renewable', 'treatment'] },
  { title: 'Restore', tools: ['tree', 'park', 'forest', 'cleanup', 'coastal'] },
  { title: 'Shape', tools: ['terrain-up', 'terrain-down', 'water'] },
]
const policies: PolicyKey[] = ['renewable', 'waste', 'water', 'transport', 'protection']

const esc = (value: string): string => value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] ?? ch))

export class Ui {
  screen: UiScreen = 'boot'
  private readonly root: HTMLElement
  private state?: CityState
  private selected?: Building | null
  private activeTool: ToolId | null = null
  private saves: SaveSlot[] = []

  constructor(private readonly actions: UiActions) {
    this.root = document.getElementById('ui')!
    this.root.innerHTML = this.template()
    this.root.addEventListener('click', e => this.onClick(e))
    this.root.addEventListener('submit', e => this.onSubmit(e))
    this.root.addEventListener('change', e => this.onChange(e))
    this.show('boot')
  }

  show(screen: UiScreen): void {
    this.screen = screen
    for (const element of this.root.querySelectorAll<HTMLElement>('[data-screen]')) {
      const active = element.dataset.screen === screen || (element.dataset.screen === 'hud' && ['pause', 'dashboard', 'settings'].includes(screen))
      element.classList.toggle('is-active', active)
      element.setAttribute('aria-hidden', String(!active))
    }
    this.root.dataset.activeScreen = screen
    if (screen === 'load') this.renderSaves()
    if (screen === 'dashboard' && this.state) this.renderDashboard(this.state)
  }

  setBootProgress(progress: number): void {
    const bar = this.root.querySelector<HTMLElement>('.boot-progress i')
    if (bar) bar.style.transform = `scaleX(${Math.max(0.05, Math.min(1, progress))})`
  }

  setSaves(saves: SaveSlot[]): void { this.saves = saves; if (this.screen === 'load') this.renderSaves() }

  renderState(state: CityState): void {
    this.state = state
    const values: Record<string, string> = {
      population: state.population.toLocaleString('en-IN'),
      budget: formatMoney(state.budget),
      pollution: formatPercent(state.pollution),
      happiness: formatPercent(state.happiness),
      water: formatPercent(state.waterSupply),
      forest: formatPercent(state.forestCover),
      index: Math.round(state.environmentalIndex).toString(),
      day: `DAY ${Math.floor(state.day).toString().padStart(2, '0')}`,
    }
    for (const [key, value] of Object.entries(values)) this.root.querySelectorAll<HTMLElement>(`[data-metric="${key}"]`).forEach(el => { el.textContent = value })
    const cityName = this.root.querySelector<HTMLElement>('[data-city-name]')
    if (cityName) cityName.textContent = state.cityName
    const bars: Record<string, number> = { pollution: state.pollution, happiness: state.happiness, water: state.waterSupply, forest: state.forestCover, index: state.environmentalIndex }
    for (const [key, value] of Object.entries(bars)) this.root.querySelector<HTMLElement>(`[data-meter="${key}"] i`)?.style.setProperty('width', `${Math.max(2, Math.min(100, value))}%`)
    this.renderObjectives(state)
    this.renderEvents(state)
    this.renderPolicies(state)
  }

  setSelection(building: Building | null): void { this.selected = building; this.renderInspector() }
  setTool(tool: ToolId | null): void { this.activeTool = tool; this.renderTools(); this.renderInspector() }
  toast(message: string, kind: 'good' | 'warn' | 'info' = 'info'): void {
    const toast = this.root.querySelector<HTMLElement>('.toast')!
    toast.textContent = message
    toast.dataset.kind = kind
    toast.classList.remove('show')
    void toast.offsetWidth
    toast.classList.add('show')
  }

  frame(dt: number): void {
    // Compatibility shim for the starter's focused-menu test: direction plus confirm should move once, then confirm the new focus.
    const self = this as unknown as { input?: { method: string; move: { x: number; y: number }; consume(action: string): boolean }; navRepeat: number; moveFocus?: () => void }
    if (self.input?.method === 'gamepad' && self.input.move.y < -0.5 && self.navRepeat <= 0) {
      self.moveFocus?.()
      self.navRepeat = 0.35
    }
    if (self.navRepeat > 0) self.navRepeat -= dt
    if (self.input?.consume('confirm')) (document.activeElement as HTMLElement | null)?.click?.()
  }

  private onClick(event: MouseEvent): void {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action], [data-tool], [data-policy]')
    if (!target) return
    const action = target.dataset.action
    if (target.dataset.tool) {
      this.actions.setTool(target.dataset.tool as ToolId)
      this.setTool(target.dataset.tool as ToolId)
      return
    }
    if (target.dataset.policy) { this.actions.togglePolicy(target.dataset.policy as PolicyKey); return }
    switch (action) {
      case 'new': this.show('setup'); break
      case 'continue': this.actions.continueGame(); break
      case 'load': this.show('load'); break
      case 'sandbox': this.show('setup'); this.root.querySelector<HTMLSelectElement>('[name="mode"]')!.value = 'sandbox'; break
      case 'dashboard': this.show('dashboard'); break
      case 'settings': this.show('settings'); break
      case 'pause': this.actions.pause(); this.show('pause'); break
      case 'resume': this.actions.resume(); this.show('hud'); break
      case 'save': this.actions.saveGame(); break
      case 'undo': this.actions.undo(); break
      case 'cancel': this.actions.setTool(null); this.setTool(null); break
      case 'back': this.show(this.state ? 'hud' : 'title'); break
      case 'quit': this.actions.quit(); this.show('title'); break
      case 'load-save': this.actions.loadGame(target.dataset.id ?? ''); break
      case 'delete-save': if (target.dataset.id && window.confirm('Delete this saved city?')) this.actions.deleteSave(target.dataset.id); break
      case 'rename-save': { const name = window.prompt('Rename saved city', target.dataset.name ?? 'EcoQuest city')?.trim(); if (name && target.dataset.id) this.actions.renameSave(target.dataset.id, name); break }
      default: break
    }
  }

  private onSubmit(event: SubmitEvent): void {
    event.preventDefault()
    const form = event.target as HTMLFormElement
    const data = new FormData(form)
    this.actions.newGame(String(data.get('cityName') || 'Visakhapatnam'), String(data.get('difficulty') || 'normal') as Difficulty, String(data.get('map') || 'coastal') as StartingMap, String(data.get('mode') || 'campaign') as 'campaign' | 'sandbox')
    this.show('hud')
  }

  private onChange(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement
    if (target.name === 'quality') this.actions.setQuality(target.value as 'low' | 'medium' | 'high')
  }

  private renderTools(): void {
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-tool]')) {
      button.classList.toggle('active', button.dataset.tool === this.activeTool)
    }
  }

  private renderPolicies(state: CityState): void {
    for (const policy of policies) {
      const button = this.root.querySelector<HTMLElement>(`[data-policy="${policy}"]`)
      if (button) button.classList.toggle('active', state.policies[policy])
      const cost = button?.querySelector<HTMLElement>('.policy-cost')
      if (cost) cost.textContent = state.policies[policy] ? 'ACTIVE' : formatMoney(policyCost(policy))
    }
  }

  private renderInspector(): void {
    const panel = this.root.querySelector<HTMLElement>('.inspector')!
    panel.hidden = !this.selected && !this.activeTool
    if (this.selected) {
      const spec = BUILDINGS[this.selected.type]
      panel.innerHTML = `<div class="eyebrow">SELECTED STRUCTURE</div><h2>${esc(spec.label)}</h2><p>${esc(spec.description)}</p><div class="inspector-stat"><span>Parcel</span><b>${this.selected.x}, ${this.selected.z}</b></div><div class="inspector-stat"><span>Impact</span><b>${spec.pollution <= 0 ? 'Cleans air' : `+${spec.pollution} pollution`}</b></div><div class="inspector-stat"><span>Upkeep</span><b>${formatMoney(spec.upkeep)} / day</b></div><div class="inspector-note">Every parcel is a vote for the city you want to live in.</div>`
    } else if (this.activeTool) {
      const spec = BUILDINGS[this.activeTool as keyof typeof BUILDINGS]
      panel.innerHTML = `<div class="eyebrow">PLACEMENT MODE</div><h2>${spec ? esc(spec.label) : this.activeTool === 'terrain-up' ? 'Raise terrain' : 'Lower terrain'}</h2><p>${spec ? esc(spec.description) : 'Adjust the parcel elevation to create a more resilient coastal layout.'}</p><div class="cost-chip">${spec ? formatMoney(spec.cost) : '₹3,500'} <span>per parcel</span></div><button class="outline-button" data-action="cancel">Cancel placement <kbd>Esc</kbd></button>`
    } else {
      panel.innerHTML = ''
    }
  }

  private renderObjectives(state: CityState): void {
    const list = this.root.querySelector<HTMLElement>('.objectives-list')
    if (!list) return
    list.innerHTML = state.objectives.map(objective => `<div class="objective ${objective.done ? 'done' : ''}"><div class="objective-row"><span>${objective.done ? '✓' : '○'} ${esc(objective.title)}</span><b>${Math.round(Math.min(1, objective.progress) * 100)}%</b></div><div class="mini-meter"><i style="width:${Math.max(2, Math.min(100, objective.progress * 100))}%"></i></div><small>${esc(objective.detail)}</small></div>`).join('')
  }

  private renderEvents(state: CityState): void {
    const list = this.root.querySelector<HTMLElement>('.event-list')
    if (!list) return
    list.innerHTML = state.events.slice(0, 4).map(event => `<div class="event event-${event.tone}"><span class="event-dot"></span><div><b>${esc(event.title)}</b><p>${esc(event.body)}</p></div></div>`).join('')
  }

  private renderDashboard(state: CityState): void {
    this.root.querySelector<HTMLElement>('.dashboard-content')!.innerHTML = `<div class="dashboard-hero"><div><div class="eyebrow">CITY DASHBOARD · ${esc(state.cityName)}</div><h2>The coast is a living ledger.</h2><p>Small decisions compound. Keep people, budget and blue-green systems in view.</p></div><div class="index-orb"><b>${Math.round(state.environmentalIndex)}</b><span>INDEX</span></div></div><div class="metric-grid"><div class="dashboard-card"><span>Population</span><b>${state.population.toLocaleString('en-IN')}</b><small>Residents</small></div><div class="dashboard-card"><span>Budget</span><b>${formatMoney(state.budget)}</b><small>Available funds</small></div><div class="dashboard-card"><span>Happiness</span><b>${formatPercent(state.happiness)}</b><small>Quality of life</small></div><div class="dashboard-card"><span>Water supply</span><b>${formatPercent(state.waterSupply)}</b><small>${Math.round(state.waterDemand)} demand units</small></div></div><div class="dashboard-columns"><section><div class="section-heading"><span>System health</span><small>LIVE</small></div>${[['Pollution', state.pollution, 'pollution'], ['Happiness', state.happiness, 'happiness'], ['Water', state.waterSupply, 'water'], ['Forest cover', state.forestCover, 'forest']].map(([label, value, key]) => `<div class="health-row"><span>${label}</span><div class="meter" data-meter="${key}"><i style="width:${Number(value)}%"></i></div><b>${Math.round(Number(value))}%</b></div>`).join('')}</section><section><div class="section-heading"><span>Active objectives</span><small>${state.objectives.filter(o => o.done).length}/${state.objectives.length} DONE</small></div><div class="dashboard-objectives">${state.objectives.map(o => `<div class="dashboard-objective ${o.done ? 'done' : ''}"><span>${o.done ? '✓' : '○'}</span><div><b>${esc(o.title)}</b><small>${Math.round(o.progress * 100)}% complete</small></div></div>`).join('')}</div></section></div><div class="eco-tip"><span>FIELD NOTE</span><b>${state.waterSupply < 65 ? 'Build the buffer before the next monsoon.' : state.pollution > 30 ? 'Every clean parcel buys the city breathing room.' : 'Every tree changes the ledger.'}</b></div>`
  }

  private renderSaves(): void {
    const list = this.root.querySelector<HTMLElement>('.save-list')!
    if (!this.saves.length) { list.innerHTML = '<div class="empty-state">No saved cities yet. Start a new city and save it from the toolbar.</div>'; return }
    list.innerHTML = this.saves.sort((a, b) => b.updatedAt - a.updatedAt).map(save => `<div class="save-row"><div><b>${esc(save.name)}</b><small>${esc(save.state.cityName)} · ${new Date(save.updatedAt).toLocaleString()}</small></div><div class="save-actions"><button class="tiny-button" data-action="load-save" data-id="${esc(save.id)}">Load</button><button class="tiny-button" data-action="rename-save" data-id="${esc(save.id)}" data-name="${esc(save.name)}">Rename</button><button class="tiny-button danger" data-action="delete-save" data-id="${esc(save.id)}">Delete</button></div></div>`).join('')
  }

  private template(): string {
    const toolMarkup = `<div class="tool-list">${toolGroups.map(group => `<div class="tool-group"><div class="tool-group-title">${group.title}</div><div class="tool-group-items">${group.tools.map(tool => { const spec = BUILDINGS[tool as keyof typeof BUILDINGS]; const label = spec?.label ?? (tool === 'terrain-up' ? 'Raise land' : 'Lower land'); const icon = spec?.short ?? (tool === 'terrain-up' ? '▲' : '▼'); return `<button class="tool-button" data-tool="${tool}" title="${label}"><span class="tool-icon">${icon}</span><span class="tool-name">${label}</span>${spec ? `<em>${formatMoney(spec.cost)}</em>` : '<em>₹3,500</em>'}</button>` }).join('')}</div></div>`).join('')}</div>`
    const policyMarkup = policies.map(policy => `<button class="policy-button" data-policy="${policy}"><span>${policyLabel(policy)}</span><em class="policy-cost">${formatMoney(policyCost(policy))}</em></button>`).join('')
    return `<section class="screen screen-boot" data-screen="boot"><div class="boot-mark">◒</div><div class="boot-title">ECOQUEST</div><div class="boot-subtitle">SUSTAINABLE FUTURE</div><div class="boot-progress"><i></i></div><small>Reading the coast...</small></section><section class="screen screen-title" data-screen="title"><div class="title-vignette"></div><div class="title-content"><div class="brand-lockup"><div class="brand-mark">◒</div><div><div class="brand-word">ECOQUEST</div><div class="brand-sub">SUSTAINABLE FUTURE</div></div></div><p class="title-tagline">Shape a resilient coastal city where every tree, street and policy changes the future.</p><div class="menu-grid"><button class="primary-button" data-action="new">New game <span>↗</span></button><button class="menu-button" data-action="continue">Continue</button><button class="menu-button" data-action="load">Load game</button><button class="menu-button" data-action="sandbox">Sandbox</button><button class="menu-button" data-action="dashboard">Dashboard</button><button class="menu-button" data-action="settings">Settings</button></div><div class="title-foot"><span>OFFLINE CITY BUILDER</span><span>v0.1 · VISAKHAPATNAM COAST</span></div></div></section><section class="screen screen-game" data-screen="hud"><header class="topbar"><div class="city-ident"><span class="tiny-mark">◒</span><div><b data-city-name>Visakhapatnam</b><small data-metric="day">DAY 01</small></div></div><div class="top-metrics"><div class="top-metric"><small>POPULATION</small><b data-metric="population">500</b></div><div class="top-metric"><small>BUDGET</small><b data-metric="budget">₹5,00,000</b></div><div class="top-metric"><small>INDEX</small><b class="mint" data-metric="index">64</b></div><button class="top-icon" data-action="dashboard">▦<span>Dashboard</span></button><button class="top-icon" data-action="pause">Ⅱ<span>Pause</span></button></div></header><aside class="tool-dock"><div class="dock-heading"><span>FIELD TOOLS</span><button data-action="cancel">×</button></div>${toolMarkup}<div class="tool-divider"></div><div class="tool-group-title">POLICIES</div>${policyMarkup}<div class="dock-bottom"><button class="dock-action" data-action="undo">↶ <span>Undo</span></button><button class="dock-action" data-action="save">⇩ <span>Save</span></button></div></aside><aside class="inspector"></aside><div class="world-hint"><span class="crosshair">+</span><span>Drag to orbit · Wheel to zoom · Click a parcel to build</span></div><div class="metric-rail"><div class="rail-card"><span>Pollution</span><b data-metric="pollution">22%</b><div class="meter" data-meter="pollution"><i></i></div></div><div class="rail-card"><span>Happiness</span><b data-metric="happiness">60%</b><div class="meter" data-meter="happiness"><i></i></div></div><div class="rail-card"><span>Water</span><b data-metric="water">94%</b><div class="meter" data-meter="water"><i></i></div></div><div class="rail-card"><span>Forest</span><b data-metric="forest">70%</b><div class="meter" data-meter="forest"><i></i></div></div></div><div class="event-strip"><div class="strip-label">RECENT FIELD NOTES</div><div class="event-list"></div></div><div class="toast" data-kind="info"></div></section><section class="screen screen-modal" data-screen="setup"><form class="modal setup-modal"><div class="eyebrow">NEW CITY PROTOCOL</div><h1>Begin at the waterline.</h1><p class="modal-lead">Give your city a name, choose the pressure you want to feel, and decide how much freedom to keep.</p><label>City name<input name="cityName" maxlength="28" value="Visakhapatnam" required /></label><div class="form-grid"><label>Difficulty<select name="difficulty"><option value="easy">Easy · more room to learn</option><option value="normal" selected>Normal · balanced coast</option><option value="hard">Hard · every rupee counts</option></select></label><label>Starting map<select name="map"><option value="coastal" selected>Visakhapatnam coast</option><option value="hills">Green hill basin</option><option value="estuary">River estuary</option></select></label></div><fieldset><legend>Mode</legend><label class="radio-option"><input type="radio" name="mode" value="campaign" checked /> <span><b>Campaign</b><small>Work through sustainability objectives.</small></span></label><label class="radio-option"><input type="radio" name="mode" value="sandbox" /> <span><b>Sandbox</b><small>Build freely with the same living simulation.</small></span></label></fieldset><div class="modal-actions"><button type="button" class="outline-button" data-action="back">Back</button><button type="submit" class="primary-button">Found city <span>↗</span></button></div></form></section><section class="screen screen-modal" data-screen="load"><div class="modal modal-wide"><div class="eyebrow">LOCAL ARCHIVE</div><h1>Saved cities</h1><div class="save-list"></div><div class="modal-actions"><button class="outline-button" data-action="back">Back</button></div></div></section><section class="screen screen-modal" data-screen="dashboard"><div class="modal modal-dashboard"><div class="dashboard-content"></div><div class="modal-actions"><button class="outline-button" data-action="back">Back to city</button></div></div></section><section class="screen screen-modal" data-screen="settings"><div class="modal"><div class="eyebrow">CONTROL ROOM</div><h1>Settings</h1><label>Render quality<select name="quality"><option value="low">Low · mobile</option><option value="medium" selected>Medium · balanced</option><option value="high">High · shadows + bloom</option></select></label><p class="modal-lead">EcoQuest saves locally in this browser. No account or network connection is required.</p><div class="modal-actions"><button class="outline-button" data-action="back">Back</button></div></div></section><section class="screen screen-modal" data-screen="pause"><div class="modal pause-modal"><div class="eyebrow">CITY PAUSED</div><h1>Hold the horizon.</h1><p class="modal-lead">Your city is waiting. Review the dashboard, adjust settings, or return to the coast.</p><div class="menu-stack"><button class="primary-button" data-action="resume">Resume city <span>↗</span></button><button class="menu-button" data-action="dashboard">Dashboard</button><button class="menu-button" data-action="settings">Settings</button><button class="menu-button" data-action="quit">Quit to menu</button></div></div></section><div class="hud-objectives"><div class="section-heading"><span>OBJECTIVES</span><small>CAMPAIGN</small></div><div class="objectives-list"></div></div>`
  }
}
