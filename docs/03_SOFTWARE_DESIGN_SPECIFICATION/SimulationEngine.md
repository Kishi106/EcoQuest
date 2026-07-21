# Simulation Engine Specification

**Project:** EcoQuest: Sustainable Future

**Document ID:** SDS-003

**Version:** 1.0

**Status:** Approved

---

# 1. Purpose

The Simulation Engine is the central execution system of EcoQuest.

It is responsible for coordinating every gameplay system, ensuring that all environmental, economic, and citizen simulations update in a consistent, deterministic, and predictable manner.

Every simulation system in the game executes through the Simulation Engine.

---

# 2. Responsibilities

The Simulation Engine is responsible for:

- Simulation Clock
- Fixed Time Step
- System Scheduling
- Tick Processing
- Event Processing
- Time Scaling
- Pause/Resume
- Save Synchronization
- Performance Monitoring
- Deterministic Execution

The Simulation Engine does NOT contain gameplay rules.

Individual systems own their own logic.

---

# 3. Design Goals

The engine should be:

- Deterministic
- Modular
- Predictable
- High Performance
- Scalable
- Easy to Debug
- Independent of Rendering

---

# 4. Architecture

```
Player Input
      │
      ▼
Simulation Engine
      │
      ▼
System Scheduler
      │
      ▼
Simulation Systems
      │
      ▼
Event Queue
      │
      ▼
Renderer
```

The Simulation Engine coordinates all updates.

---

# 5. Simulation Tick

A simulation tick represents one complete update cycle.

Each tick performs:

1. Read Commands
2. Update Clock
3. Execute Systems
4. Process Events
5. Update Game State
6. Notify UI
7. Render Frame

---

# 6. Fixed Time Step

EcoQuest uses a **Fixed Time Step**.

Advantages:

- Consistent simulation
- Easier debugging
- Stable calculations
- Reliable saves

Example

```
Simulation Tick

100 ms
```

Regardless of FPS, the simulation updates at a fixed interval.

---

# 7. Rendering vs Simulation

Rendering and Simulation are independent.

```
Simulation

10 Updates/sec

↓

Rendering

60 FPS
```

The game can render smoothly even if simulation updates are slower.

---

# 8. Simulation Clock

The Simulation Clock controls game progression.

Tracks:

- Seconds
- Minutes
- Hours
- Days
- Months
- Years

Example

```
08:00

↓

08:01

↓

08:02
```

Time always moves forward.

---

# 9. Time Scale

Players may adjust simulation speed.

Supported speeds:

- Pause
- 1x
- 2x
- 4x
- 8x

Higher speeds increase simulation frequency without changing logic.

---

# 10. Pause Mode

When paused:

Simulation Stops

Clock Stops

Events Stop

Animations may continue.

UI remains interactive.

---

# 11. Scheduler

The Scheduler determines execution order.

Order is critical.

Default sequence:

1. Clock
2. Weather
3. Climate
4. Water
5. Terrain
6. Forests
7. Wildlife
8. Resources
9. Buildings
10. Economy
11. Citizens
12. Missions
13. Statistics

---

# 12. System Dependencies

Systems only execute after dependencies finish.

Example

```
Climate

↓

Rainfall

↓

Water

↓

Agriculture

↓

Citizens
```

Incorrect execution order produces invalid simulation results.

---

# 13. Event Queue

Systems never modify each other directly.

Instead:

```
Building Created

↓

Event Queue

↓

Environment System

↓

Pollution Updated
```

Benefits:

- Loose Coupling
- Easier Testing
- Cleaner Architecture

---

# 14. Event Processing

Each tick:

Generate Events

↓

Queue Events

↓

Process Queue

↓

Notify Systems

↓

Clear Queue

Events execute in the order they were generated.

---

# 15. Update Types

Simulation uses multiple update frequencies.

### Every Tick

Citizens

Buildings

Economy

### Every Hour

Wildlife

Forests

### Every Day

Climate Health

Environment Score

Statistics

This reduces CPU usage.

---

# 16. Dirty Updates

Only changed systems recalculate.

Example

No Rain

↓

Water Quality unchanged

↓

Skip Calculation

Dirty updates improve performance.

---

# 17. Deterministic Simulation

Identical inputs should always produce identical outputs.

Benefits:

- Reliable Saves
- Easier Debugging
- Replay Support
- Testing

Random events must use seeded random generators.

---

# 18. Random Number Generation

The engine uses a seeded RNG.

Random events include:

- Rain
- Wildlife Movement
- Tree Growth
- Natural Disasters

Using a seed guarantees reproducible simulations.

---

# 19. Save Synchronization

Before saving:

- Finish Current Tick
- Flush Event Queue
- Update State
- Serialize Data

Never save during an incomplete simulation cycle.

---

# 20. Loading

When loading:

1. Load Save Data
2. Restore Systems
3. Restore Clock
4. Restore Event Queue
5. Resume Simulation

---

# 21. Error Recovery

If a subsystem fails:

- Log Error
- Skip Failed System
- Continue Remaining Systems

The engine should never crash because one module fails.

---

# 22. Performance Monitoring

Track:

- Tick Duration
- Active Events
- Memory Usage
- FPS
- Simulation Time

Useful for optimization.

---

# 23. Multithreading (Future)

Future versions may move expensive systems to workers.

Potential candidates:

- Wildlife
- Climate
- Forest Growth
- Statistics

Synchronization will occur at tick boundaries.

---

# 24. Simulation States

```
Initializing

↓

Running

↓

Paused

↓

Saving

↓

Loading

↓

Stopped
```

Only one state may be active at a time.

---

# 25. Simulation State Machine

| Current State | Event | Next State |
|---------------|-------|------------|
| Initializing | Ready | Running |
| Running | Pause | Paused |
| Paused | Resume | Running |
| Running | Save | Saving |
| Saving | Complete | Running |
| Running | Load | Loading |
| Loading | Complete | Running |
| Running | Exit | Stopped |

---

# 26. Performance Targets

| Metric | Target |
|----------|--------|
| Simulation Tick | < 20 ms |
| Save Time | < 2 sec |
| Load Time | < 3 sec |
| FPS | 60+ |
| Memory | Stable |

---

# 27. Future Expansion

The Simulation Engine is designed to support:

- Multiplayer
- AI Advisors
- Mod Support
- Large Maps
- Multiple Cities
- Dynamic Plugins

No architectural redesign should be required.

---

# 28. Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0 | July 2026 | Initial Simulation Engine Specification |

---

# 29. Approval

| Role | Status |
|------|--------|
| Project Lead | Approved |
| Technical Lead | Approved |
| Documentation | Approved |

---

**End of Document**