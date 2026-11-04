# EcoQuest: Sustainable Future — Plan

## Implementation

EcoQuest is an offline single-player Three.js/Vite game. The starter engine and build pipeline remain in place, while the starter Sky Cores game layer is replaced with an isometric city-builder scene. The simulation is kept in `src/game/city-model.ts` as serializable pure state plus deterministic rules. `src/game/game.ts` owns the Three.js scene, picking, placement preview, camera orbit/zoom, animated day/night lighting, procedural coastal terrain, city structures, and simulation ticks. `src/ui/ui.ts` renders the HTML interface, main menu, setup flow, tool palette, dashboard, save/load overlays, settings, notifications, objectives, and selected-building panel. `src/main.ts` connects the scene, UI, localStorage saves, and the fixed loop without a backend or external API keys.

The world is an immediately visible elevated/isometric coastal town: a green peninsula with beach, water, low hills, roads, a starter civic hub and compact buildings. Most city geometry is procedural low-poly for fast iteration; a generated sustainability-hub landmark is registered when available and safely falls back to the procedural civic model if the asset is not yet landed. Clicking the canvas uses raycasting onto a tiled city plane. Every tool exposes cost and effects before placement, rejects unaffordable or occupied tiles, updates budget/resources, and records an undo snapshot. City state is saved as JSON in localStorage with a versioned key, including renamed saves and latest-save continuation.

## Project structure

- `src/main.ts`: boot, fixed animation loop, app wiring, local saves.
- `src/game/city-model.ts`: city state, building catalog, simulation formulas, objectives, save serialization.
- `src/game/game.ts`: Three.js scene, procedural isometric coastal map, camera and pointer placement/selection.
- `src/ui/ui.ts`: semantic HTML controls, screens, dashboard, feedback and save/load flows.
- `src/styles/main.css`: dark emerald visual system, responsive panels and mobile layout.
- `public/manus-routes.json`: route declaration for the single game route.
- `assets/models/`: optional approved generated focal model, registered through the Game asset lifecycle.

## Design

Three sampled directions: `Coastal Data Atelier` (0.07), `Monsoon Neon Civic` (0.05), `Quiet Eco Observatory` (0.08). Chosen direction: **Coastal Data Atelier**.

- **Design Movement:** editorial civic-tech dashboard meets low-poly coastal diorama.
- **Core Principles:** readable at a glance, calm but consequential, tactile placement, nature as infrastructure.
- **Color Philosophy:** deep midnight blue-green makes the emerald sustainability signal feel earned; warm sand and coral accents reference Visakhapatnam’s coast and keep utility states legible.
- **Layout Paradigm:** a broad unobstructed diorama with slim floating instrument rails, a left action dock, and a right contextual inspector rather than a centered app grid.
- **Signature Elements:** emerald ring meters, translucent nautical chart lines, and tiny “field note” event cards with leaf markers.
- **Interaction Philosophy:** tools preview consequences before commitment; invalid actions explain why instead of merely failing.
- **Animation:** slow water drift, tree sway, building glow for active sustainability infrastructure, gentle day/night luminance shift, and crisp 140ms panel transitions.
- **Typography System:** bundled ManusCC0 for compact instrument labels and humanist body copy; large condensed all-caps only for major metrics.
- **Brand Essence:** a city-builder that makes sustainability feel like a series of visible, hopeful choices; **observant, optimistic, practical**.
- **Brand Voice:** headlines are confident and specific; microcopy is concise and coaching. Examples: “Build the buffer before the storm.” and “Every tree changes the ledger.”
- **Wordmark & Logo:** a stacked leaf/compass mark with a small coastline underline, paired with the ECOQUEST wordmark.
- **Signature Brand Color:** `#42D6A1`, an ownable “mangrove mint” used for progress, active tools, and healthy systems.
