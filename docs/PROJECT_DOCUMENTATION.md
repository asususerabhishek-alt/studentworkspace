# Student Productivity Suite / Student Workspace • Complete Project Documentation
**Course & Project Title:** Student Productivity Suite (Student Workspace)  
**Student Name:** Abhishek Kumar  
**Institution:** Chandigarh University  
**Technology Stack:** WebAssembly SQLite (`sql.js`), Next.js (React), HTML5/CSS3 Design System  
**Deployment Support:** GitHub Pages & Vercel  

---

## 1. System Overview & Problem Statement

College students routinely balance dense course curricula, concurrent lab deliverables, grade targets, and preparation for mid-term and end-term exams. Existing tools suffer from excessive cognitive load, mandatory cloud registrations, external database dependencies, and lack of integration between tasks, GPA calculation, and study timers.

**Student Workspace** (`studentproductivitysuite.app`) provides a clean, unified, calm academic workspace offering:
- **Priority-Ranked Assignment & Task Manager**
- **10-Point University SGPA / CGPA Grade Calculator with Target Simulator**
- **Multithreaded / Interval-Driven Pomodoro Study Focus Timer**
- **Active Recall Revision Flashcards Deck (3D Flip Transitions)**
- **Embedded Local SQLite Database (WebAssembly Engine)**
- **Automated Academic Summary Report & JSON Data Backup**

---

## 2. Core Functional Modules

### Module 1: Assignments & Academic Deadlines
- **Task Prioritization:** High (Coral), Medium (Amber), Low (Blue) priority queues.
- **Dynamic Search & Filtering:** Real-time filtering by course name, task title, priority, and completion status.
- **Estimated Hours & Due Date Countdowns:** Visual tags indicating days remaining and workload.
- **SQL Operations:** Direct `INSERT`, `UPDATE`, and `DELETE` transactions against the local `tasks` table.

### Module 2: SGPA / CGPA Grade Calculator
- **Standard 10-Point Scale:** A+ (10), A (9), B+ (8), B (7), C+ (6), C (5), D (4), F (0).
- **Weighted Credit Calculation:** Formula:
  $$\text{SGPA} = \frac{\sum (\text{Credits}_i \times \text{GradePoint}_i)}{\sum \text{Credits}_i}$$
- **Honors Standing Classification:** Automatically categorizes academic standing into *First Class with Distinction*, *First Class with Honors*, *First Class*, or *Passing Standing*.
- **Target Simulator:** Computes the average grade point required in upcoming courses to achieve a target CGPA.
- **SQL Operations:** Relational records persisted in the `courses` SQLite table.

### Module 3: Pomodoro Focus Study Timer
- **Structured Intervals:** 25-minute deep focus sprints, 5-minute short breaks, and 15-minute long recess intervals.
- **Visual Circular Progress:** Animated SVG ring showing elapsed time percentage.
- **Streak & Session Tracker:** Increments completed session count, logs total focus minutes, and tracks daily streaks.
- **SQL Operations:** Session completions logged into `pomodoro_sessions` table.

### Module 4: Active Recall Revision Flashcards
- **Card Flipped Interaction:** 3D CSS `rotateY` card-flipping animation with front-face (prompt) and back-face (explanation).
- **Keyboard Navigation:** Spacebar flips the card; arrow buttons cycle through concept prompts.
- **Mastery Tracker:** Toggles mastered concept status and computes retrieval mastery percentages.
- **SQL Operations:** Cards stored in `flashcards` table.

### Module 5: Performance Analytics & Data Export
- **ASCII Academic Summary:** Live formatted plain-text performance summary ready for copy or download.
- **Text & JSON Backups:** One-click offline export of all relational data.

---

## 3. Database Architecture & Schema

The workspace leverages **SQLite compiled to WebAssembly** via `sql.js`. This enables true relational database execution directly inside the browser environment without native binary compilation failures or external server requirements.

```sql
-- 1. Courses Table
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  credits REAL NOT NULL,
  grade TEXT NOT NULL,
  grade_point REAL NOT NULL,
  created_at INTEGER NOT NULL
);

-- 2. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  course TEXT NOT NULL,
  due_date TEXT NOT NULL,
  priority TEXT NOT NULL,
  hours INTEGER NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- 3. Flashcards Table
CREATE TABLE IF NOT EXISTS flashcards (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  mastered INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- 4. Pomodoro Sessions Table
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  completed_at INTEGER NOT NULL
);
```

**Unseeded Initial State:** In accordance with production specifications, database schemas initialize without mock rows. When a student first opens the workspace, tables are empty, and modules present helpful empty states guiding the user to record their initial assignments and courses.

---

## 4. Dual Deployment Architecture

### A. GitHub Pages
- Powered by root `index.html`, `style.css`, and `app.js`.
- Utilizes `.nojekyll` to prevent asset stripping.
- Runs WebAssembly SQLite in-browser with binary persistence to browser storage.
- Zero server costs, zero backend dependencies.

### B. Vercel
- Powered by Next.js (`pages/index.js`) and serverless API routes (`pages/api/*`).
- Portable `sql.js` engine runs inside Vercel's serverless runtime without native C++ compilation mismatches.
- High-availability edge caching and instant global CDN delivery.

---

## 5. Academic References & Bibliography
1. **Francesco Cirillo**, *The Pomodoro Technique: The Acclaimed Time-Management System That Has Transformed How We Work*, Currency / Penguin Random House, 2018.
2. **Karpicke, J. D., & Blunt, J. R.**, *Retrieval Practice Produces More Learning than Elaborative Studying with Concept Mapping*, Science, 331(6018), 772-775.
3. **Richard Hipp**, *SQLite Architecture and Embedded Database Engines*, SQLite Development Team.
4. **Vercel Documentation**, *Next.js Serverless Functions, Edge Rendering, and Static Optimization*, Vercel Inc., 2024.
