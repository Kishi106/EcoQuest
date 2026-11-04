// EcoQuest smoke test: builds must already exist in dist/ (`pnpm build`).
// Boots the real rendered scene, creates a city, places a nature asset, toggles a policy,
// opens the dashboard, and checks the responsive layout without external services.
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const port = 4300 + Math.floor(Math.random() * 500)
const url = `http://127.0.0.1:${port}/`
const out = process.env.SHOTS_DIR ?? 'shots'
mkdirSync(out, { recursive: true })
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], { stdio: 'ignore' })
let browser
const errors = []
const guard = setTimeout(() => fail('timed out'), 120_000)
function cleanup() { clearTimeout(guard); try { server.kill('SIGTERM') } catch {} }
async function fail(message) { console.error(`smoke: FAIL — ${message}`); await browser?.close().catch(() => {}); cleanup(); process.exit(1) }
async function waitForServer() { for (let i = 0; i < 60; i += 1) { try { if ((await fetch(url)).ok) return } catch {} await new Promise(resolve => setTimeout(resolve, 250)) } throw new Error('preview server did not start') }
async function openGame(context) {
  const page = await context.newPage()
  page.on('console', msg => msg.type() === 'error' && errors.push(msg.text()))
  page.on('pageerror', error => errors.push(String(error)))
  page.on('response', response => response.status() >= 400 && errors.push(`HTTP ${response.status()} ${response.url()}`))
  await page.goto(url)
  await page.waitForSelector('[data-screen="title"].is-active', { timeout: 30_000 })
  return page
}

try {
  await waitForServer()
  browser = await chromium.launch({ args: ['--ignore-gpu-blocklist'] }).catch(() => chromium.launch({ args: ['--ignore-gpu-blocklist'], channel: 'chrome' }))
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: 'en-US' })
  const page = await openGame(desktop)
  await page.screenshot({ path: `${out}/01-title.png` })
  await page.click('[data-action="new"]')
  await page.waitForSelector('[data-screen="setup"].is-active')
  await page.fill('[name="cityName"]', 'Green Vizag')
  await page.selectOption('[name="difficulty"]', 'normal')
  await page.click('[data-screen="setup"] button[type="submit"]')
  await page.waitForSelector('[data-screen="hud"].is-active')
  await page.waitForTimeout(700)
  const before = await page.evaluate(() => window.__game.game.current)
  await page.click('[data-tool="tree"]')
  await page.evaluate(() => { const game = window.__game.game; game.setTool('tree'); game.hover = { x: 5, z: 4 }; game.handleCanvasClick() })
  const after = await page.evaluate(() => window.__game.game.current)
  if (after.buildings.length <= before.buildings.length) throw new Error('tree placement did not update city state')
  await page.click('[data-policy="water"]')
  const policyOn = await page.evaluate(() => window.__game.game.current.policies.water)
  if (!policyOn) throw new Error('water conservation policy did not activate')
  await page.click('[data-action="dashboard"]')
  await page.waitForSelector('[data-screen="dashboard"].is-active')
  await page.screenshot({ path: `${out}/02-dashboard.png` })
  await page.click('[data-action="back"]')
  await page.waitForSelector('[data-screen="hud"].is-active')
  await page.screenshot({ path: `${out}/03-city.png` })
  const metrics = await page.evaluate(() => ({ population: window.__game.game.current.population, env: window.__game.game.current.environmentalIndex, title: document.querySelector('[data-city-name]')?.textContent }))
  if (metrics.title !== 'Green Vizag') throw new Error(`city name did not update (${metrics.title})`)
  await desktop.close()

  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'en-US' })
  const phonePage = await openGame(phone)
  await phonePage.click('[data-action="new"]')
  await phonePage.waitForSelector('[data-screen="setup"].is-active')
  await phonePage.click('[data-screen="setup"] button[type="submit"]')
  await phonePage.waitForSelector('[data-screen="hud"].is-active')
  await phonePage.screenshot({ path: `${out}/04-phone.png` })
  await phone.close()
  if (errors.length) throw new Error(`console errors:\n  ${errors.join('\n  ')}`)
  await browser.close()
  cleanup()
  console.log(`smoke: OK — metrics ${JSON.stringify(metrics)}, screenshots in ${out}/`)
} catch (error) { await fail(error?.message ?? String(error)) }
