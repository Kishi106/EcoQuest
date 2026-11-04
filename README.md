# EcoQuest: Sustainable Future

EcoQuest is a polished offline single-player 3D/isometric city-builder built with Three.js and Vite. Grow a small coastal city inspired by Visakhapatnam while balancing population, budget, pollution, happiness, water and forest cover. The city is playable immediately: select a field tool, hover a parcel for a placement preview, click to build, and inspect the consequences in the dashboard.

## Run locally

```bash
pnpm install
pnpm dev
```

Open the Vite URL shown in the terminal. The managed Preview runtime uses port `3000`; the game can also be served by any static host after building.

## Build and checks

```bash
pnpm build     # restore registered assets, generate share metadata, typecheck and build dist/
pnpm test      # unit tests
pnpm smoke     # browser smoke flow when Chromium is available
```

The production build is emitted to `dist/`. No backend, account, database, external API key or network connection is required to play. City saves are versioned JSON records in browser localStorage, including Continue, Load, Rename and Delete flows.

## Controls

Drag the scene to orbit the isometric camera, use the mouse wheel to zoom, and use the arrow keys or WASD to adjust the view. Click a construction, nature, water or terrain tool, then click an open parcel. Escape cancels placement. The left field dock also contains local policy toggles, Undo and Save. Dashboard shows the live simulation, objectives, field notes and eco tip.

## Project map

- `src/game/city-model.ts` contains serializable city state, catalog data, simulation formulas, objectives, save-friendly operations and policy rules.
- `src/game/game.ts` contains the Three.js coastal diorama, camera, raycast placement, previews, selection, animation and generated civic-hub integration.
- `src/ui/ui.ts` contains the HTML interface, setup flow, tool dock, inspector, dashboard and save/load overlays.
- `src/styles/main.css` contains the dark coastal civic-tech visual system and responsive mobile layout.
- `assets.lock.json` records the registered generated landmark and sharing artwork.
- `game-sharing.json` and `assets/share/` contain game-specific sharing metadata, favicon and OG cover.
