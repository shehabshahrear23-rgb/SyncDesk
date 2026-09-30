# 🌐 SyncDesk

> **Enterprise Workspace Portal & Digital Command Center**

SyncDesk is a modular, full-stack enterprise operating system designed to centralize company operations. It features a futuristic "Cyber-HUD" interface and a robust 5-tier Role-Based Access Control (RBAC) system that dynamically routes users to highly specialized dashboards based on their corporate role.

---

## ✨ Core Features

*   **Unified Authentication Gateway:** Secure, single-portal login supporting JWT sessions and 2FA.
*   **5-Tier RBAC Architecture:** Dynamic application routing tailored to specific roles:
    *   **CEO:** Executive Command Center & Digital Twin visualization.
    *   **HR:** People & Talent Directory.
    *   **Finance:** Revenue, Expense Modeling & Risk Analytics.
    *   **Product:** Project Roadmap & Operations.
    *   **Staff/Engineering:** Personal Workstation & Sprint Kanban.
*   **Futuristic Cyber-HUD UI:** Custom-built React design system featuring XOR mask gradient borders, glassmorphism, dynamic telemetry badges, and a global Light/Dark mode toggle.
*   **Global Command Shell:** Persistent navigation sidebar and header equipped with a global "AI Search" shortcut (`Cmd+K`).

---

## 🛠️ Tech Stack

**Frontend**
*   **Framework:** React 18 (Bootstrapped with Vite)
*   **Styling:** Pure CSS (Custom variables, CSS Grid/Flexbox, complex animations)
*   **Icons:** Lucide-React
*   **Routing:** React State & Component Swapping

**Backend**
*   **Framework:** FastAPI (Python)
*   **ORM:** SQLAlchemy
*   **Data Validation:** Pydantic
*   **Database:** SQLite (Development) / PostgreSQL (Production ready)
*   **Caching/Analytics:** Redis (Ready)

---

## 🚀 Getting Started

Follow these instructions to run the project locally.

### Prerequisites
*   Node.js (v18+)
*   Python (3.10+)

### 1. Backend Setup

Open a terminal and navigate to the backend directory:

\`\`\`bash
cd backend
\`\`\`

Create and activate a virtual environment:

\`\`\`bash
# On Windows
python -m venv .venv
.venv\Scripts\activate

# On macOS/Linux
python3 -m venv .venv
source .venv/bin/activate
\`\`\`

Install dependencies:

\`\`\`bash
pip install -r requirements.txt
\`\`\`

Run the FastAPI server:

\`\`\`bash
uvicorn app.main:app --reload
\`\`\`
*The API will be available at `http://localhost:8000`. You can view the Swagger documentation at `http://localhost:8000/docs`.*

### 2. Frontend Setup

Open a new terminal window and navigate to the project root:

\`\`\`bash
npm install
\`\`\`

Start the Vite development server:

\`\`\`bash
npm run dev
\`\`\`
*The frontend will be available at `http://localhost:5173`.*

---

## 🗺️ Current Roadmap / Sprints

**Sprint 1: The Authentication Gateway (In Progress)**
*   [x] Design and implement Cyber-HUD Login UI.
*   [x] Establish frontend routing architecture (`App.jsx`).
*   [x] Configure FastAPI boilerplate, CORS, and SQLAlchemy database session.
*   [ ] Implement `Users` and `Roles` database tables.
*   [ ] Build `/api/login` endpoint with JWT generation and bcrypt hashing.
*   [ ] Connect React frontend `fetch()` to FastAPI backend.

**Future Sprints:**
*   Sprint 2: Global App Shell (Sidebar/Header data integration)
*   Sprint 3: Engineering Workstation & Staff Kanban
*   Sprint 4: Global Org Directory & Project Management
*   Sprint 5: Executive Command Center & KPIs

---

## 📄 License
This project is proprietary. All rights reserved.