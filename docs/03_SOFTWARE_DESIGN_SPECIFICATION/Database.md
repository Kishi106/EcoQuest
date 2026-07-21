# Database Specification

**Project:** EcoQuest: Sustainable Future

**Document ID:** SDS-004

**Version:** 1.0

**Status:** Approved

---

# 1. Purpose

This document defines how data is stored, managed, retrieved, and maintained throughout EcoQuest.

The database stores all persistent game information, player progress, configuration data, and cloud-related resources while ensuring data integrity, consistency, and reliability.

The database is not responsible for gameplay logic. It only stores and retrieves data.

---

# 2. Responsibilities

The Database System is responsible for:

- Player Accounts
- Save Data
- Game Settings
- Cloud Synchronization
- Authentication
- Statistics
- Achievements
- Configuration Data
- User Progress

The Database System does NOT perform simulation calculations.

---

# 3. Design Goals

The database should be:

- Reliable
- Secure
- Scalable
- Consistent
- Maintainable
- Fast
- Modular
- Cloud Ready

---

# 4. Technology Stack

| Component | Technology |
|-----------|------------|
| Database | PostgreSQL |
| Backend | Supabase |
| Authentication | Supabase Auth |
| Storage | Supabase Storage |
| API | Supabase REST API |

---

# 5. Database Architecture

```
Game Client

↓

Application Layer

↓

Database Service

↓

Supabase

↓

PostgreSQL
```

The game never communicates directly with PostgreSQL.

All requests pass through the Database Service.

---

# 6. Data Categories

The database stores several categories of information.

## Player Data

- Profile
- Username
- Login Information
- Preferences

---

## Save Data

- World State
- Buildings
- Citizens
- Economy
- Environment
- Missions

---

## Configuration

- Difficulty
- Graphics
- Audio
- Controls

---

## Statistics

- Play Time
- Trees Planted
- Buildings Constructed
- Pollution Reduced
- Achievements

---

# 7. Save Data

Each save contains:

- World
- Terrain
- Water
- Climate
- Forests
- Wildlife
- Citizens
- Buildings
- Economy
- Missions
- Resources
- Simulation Time

A save represents one complete snapshot of the game.

---

# 8. Database Tables

Major tables include:

```
users

profiles

game_saves

settings

statistics

achievements

missions

leaderboards (Future)
```

Additional tables may be added as the project expands.

---

# 9. Save File Structure

Each save stores:

```
Player

↓

World

↓

Simulation

↓

Systems

↓

Statistics
```

Every subsystem serializes its own data.

---

# 10. Data Ownership

Each gameplay system owns its own data.

Example:

Climate System

owns

- Temperature
- Rainfall
- Humidity

Economy owns:

- Budget
- Revenue
- Expenses

Other systems may read this data but should not modify it directly.

---

# 11. Data Validation

Before saving:

- Required fields checked
- Invalid values rejected
- Missing objects detected
- Duplicate IDs prevented

Corrupted data should never be stored.

---

# 12. Loading Process

Loading follows this sequence:

1. Authenticate Player
2. Load Save Metadata
3. Restore World
4. Restore Simulation
5. Restore Systems
6. Resume Gameplay

---

# 13. Cloud Synchronization

Future versions may support cloud saves.

Cloud synchronization includes:

- Save Files
- Settings
- Achievements
- Statistics

Synchronization should never interrupt gameplay.

---

# 14. Backup Strategy

The database should support:

- Automatic backups
- Manual exports
- Save duplication
- Recovery from corruption

Players should never permanently lose progress.

---

# 15. Storage Optimization

The database minimizes storage by:

- Compressing save data
- Removing temporary variables
- Excluding derived values
- Storing references where possible

Only essential information should be saved.

---

# 16. Data Integrity

The system ensures:

- Unique IDs
- Referential Integrity
- Valid Relationships
- Consistent Save States

Invalid relationships should be rejected.

---

# 17. Security

Sensitive information includes:

- User Accounts
- Authentication Tokens
- Email Addresses

Sensitive information must never be exposed to unauthorized users.

---

# 18. Performance

Performance goals:

| Operation | Target |
|-----------|--------|
| Save Game | < 2 sec |
| Load Game | < 3 sec |
| Player Login | < 2 sec |
| Database Query | < 500 ms |

---

# 19. Future Expansion

The database is designed to support:

- Multiplayer Profiles
- Online Leaderboards
- Mod Data
- Community Challenges
- Shared Worlds
- Analytics

These features should integrate without redesigning the database.

---

# 20. Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0 | July 2026 | Initial database specification |

---

# 21. Approval

| Role | Status |
|------|--------|
| Project Lead | Approved |
| Technical Lead | Approved |
| Documentation | Approved |

---

**End of Document**