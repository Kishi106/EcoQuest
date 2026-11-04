import './styles/main.css'
import { Renderer } from './engine/renderer'
import type { CityState } from './game/city-model'
import { Game } from './game/game'
import { Ui, type SaveSlot } from './ui/ui'

const SAVE_KEY = 'ecoquest-saves-v1'
const SETTINGS_KEY = 'ecoquest-settings-v1'

type Settings = { quality: 'low' | 'medium' | 'high' }

function readSaves(): SaveSlot[] {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY) ?? '[]') as SaveSlot[] } catch { return [] }
}
function writeSaves(saves: SaveSlot[]): void { localStorage.setItem(SAVE_KEY, JSON.stringify(saves)) }
function readSettings(): Settings {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{"quality":"medium"}') as Settings } catch { return { quality: 'medium' } }
}
function writeSettings(settings: Settings): void { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) }
function saveName(state: CityState): string { return `${state.cityName} · Day ${Math.floor(state.day)}` }

function boot(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('#game')!
  const settings = readSettings()
  const renderer = new Renderer(canvas, settings.quality)
  let game: Game
  let ui: Ui
  let lastFrame = performance.now()
  let latestSaveId = ''

  const refreshSaves = (): SaveSlot[] => { const saves = readSaves(); ui?.setSaves(saves); return saves }
  const persistLatest = (state: CityState): void => {
    const saves = readSaves()
    const id = latestSaveId || 'autosave'
    const existing = saves.find(s => s.id === id)
    const slot: SaveSlot = { id, name: existing?.name ?? saveName(state), updatedAt: Date.now(), state }
    writeSaves([slot, ...saves.filter(s => s.id !== id)].slice(0, 12))
    ui.setSaves(readSaves())
  }

  ui = new Ui({
    newGame: (cityName, difficulty, map, mode) => { latestSaveId = ''; game.newCity(cityName, difficulty, map, mode); ui.show('hud') },
    continueGame: () => { const latest = refreshSaves().sort((a, b) => b.updatedAt - a.updatedAt)[0]; if (latest) { latestSaveId = latest.id; game.start(latest.state); ui.show('hud') } else ui.show('setup') },
    loadGame: id => { const slot = readSaves().find(save => save.id === id); if (!slot) { ui.toast('That saved city is no longer available.', 'warn'); return } latestSaveId = slot.id; game.start(slot.state); ui.show('hud') },
    deleteSave: id => { writeSaves(readSaves().filter(save => save.id !== id)); refreshSaves(); ui.toast('Saved city deleted.', 'info') },
    renameSave: (id, name) => { const saves = readSaves(); const slot = saves.find(save => save.id === id); if (slot) slot.name = name; writeSaves(saves); refreshSaves(); ui.toast('Save renamed.', 'good') },
    saveGame: () => { if (!game.current) return; const existing = readSaves().find(save => save.id === latestSaveId); const name = window.prompt('Name this saved city', existing?.name ?? saveName(game.current))?.trim(); if (!name) return; latestSaveId = latestSaveId || `save-${Date.now()}`; const saves = readSaves().filter(save => save.id !== latestSaveId); writeSaves([{ id: latestSaveId, name, updatedAt: Date.now(), state: game.current }, ...saves].slice(0, 12)); refreshSaves(); ui.toast('City saved locally.', 'good') },
    setTool: tool => { game.setTool(tool); ui.setTool(tool) },
    togglePolicy: policy => game.togglePolicy(policy),
    undo: () => game.undo(),
    pause: () => { game.pause() },
    resume: () => { game.resume() },
    quit: () => { game.toTitle(); ui.setTool(null) },
    setQuality: quality => { settings.quality = quality; writeSettings(settings); renderer.applyQuality(quality); ui.toast(`Render quality set to ${quality}.`, 'good') },
  })

  game = new Game(renderer, {
    state: state => { ui.renderState(state); if (game.mode === 'playing') persistLatest(state) },
    feedback: (message, kind) => ui.toast(message, kind),
    selection: building => ui.setSelection(building),
  })

  ui.setSaves(readSaves())
  ui.setBootProgress(0.72)
  ui.renderState(game.current)
  window.setTimeout(() => { ui.setBootProgress(1); ui.show('title') }, 650)

  const frame = (now: number): void => {
    const dt = Math.min(0.08, (now - lastFrame) / 1000)
    lastFrame = now
    game.update(dt)
    game.render()
    ui.frame(dt)
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)

  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && ui.screen === 'hud' && game.mode === 'playing') { game.pause(); ui.show('pause') }
  })
  ;(window as unknown as { __game: unknown }).__game = { game, ui }
}

boot()
