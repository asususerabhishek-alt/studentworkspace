# Student Workspace • Offline-First Academic Productivity Engine
**A Calm, High-Performance Student Productivity Workspace with Local SQLite Database**  
**Student Name:** Abhishek Kumar  
**Institution:** Chandigarh University  
**Deployment Modes:** GitHub Pages (Static WebAssembly SQLite) & Vercel (Next.js & Serverless)

---

## 1. Executive Summary & Problem Formulation

University engineering students continuously navigate demanding academic workloads: concurrent assignment deadlines, weekly lab practicals, semester SGPA forecasting, and structured exam revision. Most commercial productivity software requires cloud account creation, third-party database connections, telemetry tracking, and expensive subscriptions.

**Student Workspace** is an offline-first academic management workspace powered by an **embedded local SQLite database** (WebAssembly `sql.js`). It completely eliminates the need for external database infrastructure (such as hosted MySQL or MongoDB) while offering dual deployment flexibility:
1. **GitHub Pages Deployment**: Direct static hosting via root `index.html` with client-side WebAssembly SQLite and binary persistence.
2. **Vercel Deployment**: Serverless Next.js deployment with local SQLite queries and edge rendering.

### Key Capabilities:
- **Assignments & Academic Deadlines Tracker**: Manage coursework, lab submissions, and term papers with priority tagging (High/Medium/Low), due dates, and completion toggles.
- **Interactive SGPA / CGPA Grade Calculator**: Real-time 10-point university grading scale with credit weighting ($\text{Credits} \times \text{Grade Points}$) and dynamic honors classification (*First Class with Distinction*), along with a "What-If" grade simulator.
- **Pomodoro Focus Study Timer**: 25-minute deep focus sprints, 5-minute short breaks, and 15-minute long recess intervals with a live animated circular SVG progress clock and session streak tracking.
- **Active Recall Revision Flashcards**: 3D interactive flip-card study deck for rapid concept revision before examinations.
- **Local SQLite Persistence**: Stores all state in a local file-based and WebAssembly SQLite database with relational schemas. Tables start cleanly unseeded.

---

## 2. Database Schema & Architecture

```
+-----------------------------------------------------------------------------------+
|                         Student Workspace (Web Client)                            |
|                     (Root index.html / Next.js React UI)                          |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                     Embedded Local SQLite Database Engine                         |
|                    (sql.js WebAssembly Engine • Local Persistence)                |
+-----------------------------------------------------------------------------------+
       |                          |                         |                      |
       v                          v                         v                      v
+--------------+           +--------------+          +--------------+       +--------------+
|   courses    |           |    tasks     |          |  flashcards  |       |   pomodoro   |
|--------------|           |--------------|          |--------------|       |--------------|
| id (PK)      |           | id (PK)      |          | id (PK)      |       | id (PK)      |
| code         |           | title        |          | subject      |       | subject      |
| name         |           | course       |          | question     |       | duration_min |
| credits      |           | due_date     |          | answer       |       | completed_at |
| grade        |           | priority     |          | mastered     |       +--------------+
| grade_point  |           | hours        |          | created_at   |
| created_at   |           | completed    |          +--------------+
+--------------+           | created_at   |
                           +--------------+
```

---

## 3. How Student Workspace Solves Real Student Problems

| Student Pain Point | Commercial Tool Shortcomings | Student Workspace Solution |
| :--- | :--- | :--- |
| **Disorganized Task Overload** | Scattered portals, missed notifications, slow mobile apps | Unified, priority-ranked assignment queue with real-time countdown days. |
| **Manual GPA Calculations** | Complex credit multiplication, error-prone spreadsheets | Instant automated SGPA calculation with honors standing and target gap analysis. |
| **Study Burnout & Distraction** | Unstructured cramming, cognitive fatigue, procrastination | Scientifically proven 25-minute Pomodoro cycles with synchronized breaks. |
| **Concept Retention Gaps** | Passive re-reading of PDFs with low retention rate | Active recall digital flashcard deck with interactive 3D flip animation. |
| **Server & Cloud Fragility** | Mandatory accounts, tracking, paid subscription walls | Embedded local SQLite database, zero external server config, fully offline-first. |

---

## 4. Dual Deployment Guide

### A. Deploying via GitHub Pages (Static Hosting)
Because Student Workspace executes SQLite directly in the browser via WebAssembly (`sql.js`), it can be hosted on **GitHub Pages** with zero build configuration:

1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Student Workspace"
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. In your GitHub repository:
   - Navigate to **Settings** -> **Pages**
   - Under **Build and deployment** -> **Source**, select **Deploy from a branch**
   - Under **Branch**, select `main` and folder `/ (root)`
   - Click **Save**
3. Your site will be published at `https://<your-username>.github.io/<your-repo-name>/`.
4. Alternatively, use the automated GitHub Action workflow included in `.github/workflows/pages.yml`.

### B. Deploying via Vercel
Vercel automatically detects the project and compiles both the static interface and serverless API endpoints:

```bash
# Production deployment via Vercel CLI
npx vercel deploy --prod
```

### C. Running Locally
To launch the application locally in development:

```bash
# Option 1: Direct static preview
python3 -m http.server 3000

# Option 2: Next.js dev server
npm install
npm run dev
```

---

## 5. Source Code Structure

1. `index.html` — Accessible, semantic HTML5 single-page application with responsive layouts and modal dialogs.
2. `app.js` — Client-side WebAssembly SQLite engine (`DatabaseManager`), relational SQL schema initialization, and module controllers.
3. `style.css` — Calm Scholarly design system with warm paper neutrals (`#F7F5F0`), deep forest green accents (`#2D6A4F`), hairline borders, and fluid typography.
4. `lib/db.js` — Universal SQLite module using WebAssembly (`sql.js`) with disk persistence.
5. `pages/index.js` — Server-rendered Next.js React page with instant state synchronization.
6. `pages/api/` — Serverless REST endpoints (`/api/data`, `/api/tasks`, `/api/courses`, `/api/flashcards`, `/api/pomodoro`).
7. `.nojekyll` & `.github/workflows/pages.yml` — Native GitHub Pages configuration.
8. `vercel.json` & `package.json` — Vercel serverless deployment specifications.

---

## 6. Academic Bibliography & References
1. **Francesco Cirillo**, *The Pomodoro Technique: The Acclaimed Time-Management System That Has Transformed How We Work*, Currency / Penguin Random House, 2018.
2. **Karpicke, J. D., & Blunt, J. R.**, *Retrieval Practice Produces More Learning than Elaborative Studying with Concept Mapping*, Science, 331(6018), 772-775.
3. **Richard Hipp**, *SQLite Architecture and Embedded Database Engines*, SQLite Development Team.
4. **Vercel Documentation**, *Next.js Serverless Functions, Edge Rendering, and Static Optimization*, Vercel Inc., 2024.
