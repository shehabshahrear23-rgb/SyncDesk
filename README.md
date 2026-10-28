# 🌐 SyncDesk

> **Enterprise Workspace Portal & Digital Command Center**

SyncDesk is a modular, full-stack enterprise operating system designed to centralize company operations. It features a futuristic "Cyber-HUD" interface and a robust 5-tier Role-Based Access Control (RBAC) system that dynamically routes users to highly specialized dashboards based on their corporate role.

---

## ✨ Core Features

*   **Unified Authentication Gateway:** Secure, single-portal login supporting JWT sessions and 2FA.
*   **Role-Based Access:** Dynamic application routing for executive, administrative, HR, project, and employee roles:
    *   **CEO:** Executive Command Center & Digital Twin visualization.
    *   **Admin:** User account and role management.
    *   **HR:** People & Talent Directory; can assign tasks to Team Leads and Project Managers.
    *   **Team Lead / Project Manager:** Personal backlog and project board; can assign tasks to employees.
    *   **Employee:** Personal work dashboard and assigned task backlog.
    *   **CEO:** Can assign tasks to any account; Admin cannot assign tasks.
*   **Futuristic Cyber-HUD UI:** Custom-built React design system featuring XOR mask gradient borders, glassmorphism, dynamic telemetry badges, and a global Light/Dark mode toggle.
*   **Global Command Shell:** Persistent navigation sidebar and header equipped with a global "AI Search" shortcut (`Cmd+K`).
*   **User Notifications:** Task assignees receive in-app notifications when a task is assigned; task assigners are notified whenever the assignee advances its progress. Notifications have unread counts, a notification panel, and mark-as-read controls.
*   **Persistent Task Assignment:** Assignments require a title, an eligible user, and a future date-and-time deadline. The selected local deadline is saved and enforced as a UTC timestamp. Assignees progress tasks through Backlog → In Progress → In Review; only the assigner can approve a task or return it to Backlog with a required note. The assignee closes approved tasks with End Task. A task not approved by its exact deadline expires automatically. The CEO can view all active tasks; other users can view active tasks only when they assigned or were assigned the task. Ended and expired records remain stored for history and completion statistics but are removed from the task interface. The assignee dashboard shows successful completions as a percentage of ended and expired tasks. Sidebar task badges use live counts.
*   **Account Management:** Admins can create accounts for all supported roles, change other users' roles, and delete accounts. New accounts receive a welcome notification; users can update their own name and timezone and change their password from the shared profile menu. Successful profile, photo, and password changes create an in-app notification.
*   **Profile Pictures:** Users can upload JPEG, PNG, or WebP profile pictures up to 5 MB from Edit Profile. Images are validated, resized, and stored as `backend/media/pp/<user-id>.jpg`; accounts without an upload use `backend/media/pp/default.jpg`.
*   **Private Document Vault:** Authenticated users can upload PDF, TXT, DOC, or DOCX files up to 25 MB. Documents are private to the uploader until they grant access; recipients then receive an in-app notification. Users can star documents privately and filter their own starred list. Sample documents are shown only while no user-uploaded documents exist.

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

Create the local demo accounts and sample documents:

\`\`\`bash
python seed.py
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

## 📄 License
This project is proprietary. All rights reserved.