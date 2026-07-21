# Project Folder Structure Specification

**Project:** EcoQuest: Sustainable Future

**Document ID:** SDS-002

**Version:** 1.0

**Status:** Approved

---

# 1. Purpose

This document defines the official folder and file organization for the EcoQuest project.

A consistent folder structure improves:

- Maintainability
- Scalability
- Developer productivity
- AI-assisted code generation
- Code navigation
- Long-term project organization

Every source file should follow this specification.

---

# 2. Design Principles

The folder structure follows these principles:

- Feature-oriented organization
- Clear separation of responsibilities
- Minimal coupling
- Easy discoverability
- Predictable locations
- Reusable modules
- Clean dependency hierarchy

---

# 3. Root Directory Structure

```
EcoQuest/
│
├── docs/
├── public/
├── src/
├── supabase/
├── assets/
├── tests/
├── scripts/
├── .github/
│
├── package.json
├── vite.config.ts
├── tsconfig.json
├── README.md
└── LICENSE
```

---

# 4. Root Folder Responsibilities

## docs/

Contains all project documentation.

Includes:

- Vision
- GDD
- SDS
- Assets Documentation

No source code belongs here.

---

## src/

Contains all application source code.

Everything related to gameplay is implemented here.

---

## public/

Stores publicly accessible static files.

Examples:

- favicon
- icons
- manifest
- robots.txt

---

## assets/

Contains raw project assets.

Examples:

- Sprites
- Audio
- Fonts
- Icons
- Concept Art
- Animations

Raw assets should never contain gameplay logic.

---

## tests/

Contains automated testing.

Examples:

- Unit Tests
- Integration Tests
- Performance Tests

---

## scripts/

Contains development utilities.

Examples:

- Asset converters
- Data generators
- Build tools
- Migration scripts

---

## supabase/

Contains backend resources.

Examples:

- SQL migrations
- Edge Functions
- Database schema
- Policies

---

## .github/

Contains GitHub automation.

Examples:

- Workflows
- Issue templates
- Pull request templates

---

# 5. Source Folder Organization

```
src/

├── app/
├── components/
├── systems/
├── world/
├── simulation/
├── state/
├── services/
├── hooks/
├── utils/
├── assets/
├── styles/
├── types/
├── constants/
└── main.tsx
```

---

# 6. app/

Contains application initialization.

Responsibilities:

- Startup
- Routing
- Providers
- Global configuration

Examples:

```
app/

App.tsx

Router.tsx

Providers.tsx
```

---

# 7. components/

Contains reusable UI components.

Examples:

- Buttons
- Cards
- Panels
- Windows
- Dialogs
- Charts

Rules:

Components must never contain simulation logic.

---

# 8. systems/

Contains gameplay systems.

Examples:

```
systems/

Buildings/

Citizens/

Economy/

Environment/

Missions/
```

Each system owns:

- Logic
- Events
- Models
- Controllers

---

# 9. world/

Contains environmental systems.

Examples:

```
world/

Terrain/

Water/

Climate/

Forests/

Wildlife/

Resources/
```

Each folder represents one environmental simulation.

---

# 10. simulation/

Contains the core simulation engine.

Responsibilities:

- Update Loop
- Scheduler
- Tick Manager
- Simulation Clock
- Event Queue

Only one simulation engine exists.

---

# 11. state/

Contains global application state.

Examples:

```
state/

GameStore.ts

UIStore.ts

SettingsStore.ts
```

Recommended:

Use Zustand stores.

---

# 12. services/

Contains external integrations.

Examples:

- Save Service
- Authentication
- Cloud Storage
- Analytics
- Backend APIs

Services communicate outside the game.

---

# 13. hooks/

Contains reusable React hooks.

Examples:

```
useCamera()

useKeyboard()

useSimulation()

useSettings()
```

Hooks should remain reusable.

---

# 14. utils/

Contains helper functions.

Examples:

- Math
- Random
- Formatting
- Geometry
- Validation

Utility functions must remain stateless.

---

# 15. assets/

Contains processed game assets.

Examples:

- Icons
- Tile Atlases
- UI Images

Do not confuse this with the root assets folder.

---

# 16. styles/

Contains styling resources.

Examples:

- Tailwind configuration
- CSS
- Themes

---

# 17. types/

Contains shared TypeScript definitions.

Examples:

```
Citizen.ts

Building.ts

Terrain.ts

Weather.ts
```

All interfaces belong here.

---

# 18. constants/

Contains immutable project constants.

Examples:

```
Colors.ts

Buildings.ts

Climate.ts

Resources.ts

IDs.ts
```

Constants should never change at runtime.

---

# 19. Naming Conventions

Folders:

```
PascalCase
```

Example:

```
Buildings

Climate

Simulation
```

Files:

```
PascalCase.ts
```

Examples:

```
BuildingManager.ts

CitizenSystem.ts

WaterSimulation.ts
```

Variables:

```
camelCase
```

Constants:

```
UPPER_SNAKE_CASE
```

Enums:

```
PascalCase
```

Interfaces:

```
IBuilding

ICitizen
```

---

# 20. Import Rules

Allowed

```
UI

↓

Systems

↓

Simulation

↓

Utilities
```

Forbidden

Simulation importing UI.

Utilities importing Systems.

Components directly modifying game state.

---

# 21. File Size Guidelines

Recommended maximums:

| File Type | Limit |
|------------|--------|
| Components | 300 lines |
| Systems | 600 lines |
| Utilities | 200 lines |
| Hooks | 250 lines |
| Configuration | Unlimited |

Large files should be split into modules.

---

# 22. Asset Organization

```
assets/

audio/

fonts/

icons/

images/

music/

sprites/

tiles/

ui/
```

Assets should follow consistent naming.

Example:

```
building_factory.png

tree_oak.png

river_water.png
```

---

# 23. Documentation Rules

Every major folder should contain:

- README.md
- Purpose
- Responsibilities
- Dependencies
- Usage examples

Documentation should evolve alongside the code.

---

# 24. Future Expansion

The structure is designed to support:

- Multiplayer
- Plugins
- AI modules
- Mobile version
- Dedicated server
- Modding support

Future additions should integrate without restructuring the project.

---

# 25. Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0 | July 2026 | Initial folder structure specification |

---

# 26. Approval

| Role | Status |
|------|--------|
| Project Lead | Approved |
| Technical Lead | Approved |
| Documentation | Approved |

---

**End of Document**