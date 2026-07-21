# 🌱 EcoQuest

> **EcoQuest: Sustainable Future** is a browser-based environmental city simulation game where players redesign and sustainably develop **Visakhapatnam (Vizag)** while balancing environmental, economic, and social systems.

---

# 📖 About

EcoQuest is an educational strategy simulation that teaches sustainable urban planning through interactive gameplay.

Players take on the role of a city planner responsible for transforming Visakhapatnam into a greener, healthier, and more sustainable city. Every decision affects the city's future, challenging players to balance environmental conservation with economic growth and citizen well-being.

The game emphasizes learning through simulation, encouraging players to understand the long-term impact of their choices rather than relying on traditional educational methods.

---

# 🎮 Features

- 🏙️ Sustainable city building and expansion
- 🌳 Forest and biodiversity restoration
- 💧 Water resource management
- 🌦️ Dynamic weather and climate simulation
- 🌍 Air pollution and environmental monitoring
- ⚡ Renewable energy systems
- 👥 Citizen population and happiness simulation
- 💰 Economy and resource management
- 🎯 Environmental missions and challenges
- 📊 Real-time city statistics and analytics
- 🌊 Inspired by the city of Visakhapatnam (Vizag)

---

# 🛠️ Technology Stack

| Category | Technology |
|----------|------------|
| Frontend | React + Vite |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Backend Framework | FastAPI |
| Backend Deployment | Render |
| Frontend Deployment | Vercel |
| Database | PostgreSQL (Supabase) |
| Authentication | Supabase Auth |
| API | REST API |

---

# 🏗️ System Architecture

```text
                    ┌──────────────────────┐
                    │      Web Browser     │
                    └──────────┬───────────┘
                               │
                               ▼
                 Frontend (React + Vite)
                      Hosted on Vercel
                               │
                         REST API
                               │
                               ▼
                    Backend (FastAPI)
                     Hosted on Render
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
    PostgreSQL (Supabase)                 Supabase Auth
      Game Data & Saves                  User Authentication
```

---

# 📁 Project Structure

```text
EcoQuest/

frontend/
│
├── src/
├── public/
├── package.json
└── vite.config.ts

backend/
│
├── app/
├── api/
├── models/
├── services/
├── database/
├── main.py
├── requirements.txt
└── Dockerfile

docs/
│
├── 01_PROJECT_VISION.md
├── 02_GAME_DESIGN_DOCUMENT/
├── 03_SOFTWARE_DESIGN_SPECIFICATION/
├── 04_SYSTEM_ARCHITECTURE.md
└── AGENTS.md

README.md
```

---

# 📚 Documentation

Complete project documentation is available inside the **docs/** directory.

| Document | Description |
|----------|-------------|
| Project Vision | Defines the project's goals, scope, and objectives |
| Game Design Document | Gameplay mechanics, world design, and game systems |
| Software Design Specification | Technical architecture and implementation guidelines |
| System Architecture | High-level architecture and component interactions |
| AGENTS.md | Rules and guidelines for AI coding assistants |

---

# 🚀 Getting Started

### Clone the Repository

```bash
git clone https://github.com/Kishi106/EcoQuest.git
```

### Navigate to the Project

```bash
cd EcoQuest
```

### Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

### Backend Setup

```bash
cd backend

pip install -r requirements.txt

uvicorn main:app --reload
```

---

# 🎯 Project Goals

- Promote environmental awareness through gameplay
- Teach sustainable urban planning concepts
- Encourage strategic long-term thinking
- Simulate real-world environmental systems
- Create an engaging educational experience
- Showcase the impact of sustainable development

---

# 🗺️ Development Roadmap

## Phase 1 – Planning
- [x] Project Vision
- [x] Game Design Document (GDD)
- [x] Software Design Specification (SDS)
- [x] System Architecture
- [x] AI Agent Rules

## Phase 2 – Core Development
- [ ] Technical Design Documents
- [ ] FastAPI Backend
- [ ] React Frontend
- [ ] Authentication
- [ ] Database Integration
- [ ] Save & Load System

## Phase 3 – Simulation
- [ ] Terrain System
- [ ] Water System
- [ ] Climate System
- [ ] Forest System
- [ ] Wildlife System
- [ ] Economy System
- [ ] Citizen Simulation

## Phase 4 – Gameplay
- [ ] Buildings
- [ ] Missions
- [ ] User Interface
- [ ] Achievements
- [ ] Balancing

## Phase 5 – Release
- [ ] Public Demo
- [ ] Performance Optimization
- [ ] Final Testing
- [ ] Version 1.0 Release

---

# 🤝 Contributing

Contributions are welcome.

Before contributing, please review the documentation inside the `docs/` folder, especially:

- Game Design Document
- Software Design Specification
- AGENTS.md

Please follow the project's coding standards and architecture guidelines.

---

# 📄 License

This project is licensed under the **MIT License**.

---

# 👨‍💻 Development Team

**Team 3BearMinimum**

Built as an educational and environmental simulation project.

---

# 🌱 Vision

> *"Build a greener future, one decision at a time."*