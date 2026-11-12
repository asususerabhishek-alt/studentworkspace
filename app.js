/**
 * Student Workspace • Application Core Engine
 * Client-Side Offline Architecture powered by WebAssembly SQLite (sql.js)
 * Fully compatible with GitHub Pages & Vercel Static Hosting
 */

const GRADE_POINTS = {
  "A+": 10.0,
  "A": 9.0,
  "B+": 8.0,
  "B": 7.0,
  "C+": 6.0,
  "C": 5.0,
  "D": 4.0,
  "F": 0.0
};

// ==========================================================================
// SQLite Database Layer (WebAssembly & Local Persistence)
// ==========================================================================
class DatabaseManager {
  static STORAGE_KEY = "student_workspace_sqlite_binary";
  static FALLBACK_KEY = "student_workspace_fallback_json";

  constructor() {
    this.db = null;
    this.isSqlJsReady = false;
    // In-memory data cache
    this.cache = {
      courses: [],
      tasks: [],
      flashcards: [],
      customSubjects: [],
      pomodoroStats: {
        completedSessions: 0,
        totalMinutes: 0,
        streakDays: 0
      }
    };
  }

  async init() {
    try {
      if (typeof window.initSqlJs === "function") {
        const SQL = await window.initSqlJs({
          locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });

        const saved = localStorage.getItem(DatabaseManager.STORAGE_KEY);
        if (saved) {
          try {
            const u8 = new Uint8Array(JSON.parse(saved));
            this.db = new SQL.Database(u8);
          } catch (e) {
            console.warn("Could not parse saved SQLite binary, creating fresh DB:", e);
            this.db = new SQL.Database();
          }
        } else {
          this.db = new SQL.Database();
        }

        this.initSchema();
        this.isSqlJsReady = true;
        this.loadFromSql();
        return;
      }
    } catch (err) {
      console.warn("WebAssembly SQLite initialization notice (using fallback engine):", err);
    }

    // Fallback: LocalStorage JSON storage
    this.loadFromFallback();
  }

  initSchema() {
    if (!this.db) return;
    this.db.run(`
      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        credits REAL NOT NULL,
        grade TEXT NOT NULL,
        grade_point REAL NOT NULL,
        created_at INTEGER NOT NULL
      );
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
      CREATE TABLE IF NOT EXISTS flashcards (
        id TEXT PRIMARY KEY,
        subject TEXT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        mastered INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS pomodoro_sessions (
        id TEXT PRIMARY KEY,
        subject TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        completed_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS custom_subjects (
        name TEXT PRIMARY KEY,
        created_at INTEGER NOT NULL
      );
    `);
    // Note: Database starts unseeded per specification.
  }

  persist() {
    if (this.isSqlJsReady && this.db) {
      try {
        const binaryArray = this.db.export();
        localStorage.setItem(DatabaseManager.STORAGE_KEY, JSON.stringify(Array.from(binaryArray)));
      } catch (e) {
        console.warn("Storage quota warning on persisting SQLite DB:", e);
      }
    } else {
      try {
        localStorage.setItem(DatabaseManager.FALLBACK_KEY, JSON.stringify(this.cache));
      } catch (e) {
        console.warn("Storage quota warning on fallback save:", e);
      }
    }
  }

  loadFromSql() {
    if (!this.db) return;

    // Load courses
    const courseStmt = this.db.prepare("SELECT * FROM courses ORDER BY created_at ASC");
    const courses = [];
    while (courseStmt.step()) {
      const row = courseStmt.getAsObject();
      courses.push({
        id: row.id,
        code: row.code,
        name: row.name,
        credits: parseFloat(row.credits),
        grade: row.grade,
        gradePoint: parseFloat(row.grade_point)
      });
    }
    courseStmt.free();
    this.cache.courses = courses;

    // Load custom subjects
    try {
      const subStmt = this.db.prepare("SELECT name FROM custom_subjects ORDER BY created_at ASC");
      const subs = [];
      while (subStmt.step()) {
        const row = subStmt.getAsObject();
        if (row.name) subs.push(row.name);
      }
      subStmt.free();
      this.cache.customSubjects = subs;
    } catch (e) {
      this.cache.customSubjects = [];
    }

    // Load tasks
    const taskStmt = this.db.prepare("SELECT * FROM tasks ORDER BY created_at DESC");
    const tasks = [];
    while (taskStmt.step()) {
      const row = taskStmt.getAsObject();
      tasks.push({
        id: row.id,
        title: row.title,
        course: row.course,
        dueDate: row.due_date,
        priority: row.priority,
        hours: parseInt(row.hours, 10),
        completed: Boolean(row.completed)
      });
    }
    taskStmt.free();
    this.cache.tasks = tasks;

    // Load flashcards
    const fcStmt = this.db.prepare("SELECT * FROM flashcards ORDER BY created_at ASC");
    const flashcards = [];
    while (fcStmt.step()) {
      const row = fcStmt.getAsObject();
      flashcards.push({
        id: row.id,
        subject: row.subject,
        question: row.question,
        answer: row.answer,
        mastered: Boolean(row.mastered)
      });
    }
    fcStmt.free();
    this.cache.flashcards = flashcards;

    // Load pomodoro stats
    const pomoRes = this.db.exec("SELECT COUNT(*) as count, COALESCE(SUM(duration_minutes), 0) as total FROM pomodoro_sessions");
    let count = 0;
    let total = 0;
    if (pomoRes.length > 0 && pomoRes[0].values.length > 0) {
      count = pomoRes[0].values[0][0] || 0;
      total = pomoRes[0].values[0][1] || 0;
    }
    this.cache.pomodoroStats = {
      completedSessions: count,
      totalMinutes: total,
      streakDays: count > 0 ? Math.min(count, 4) : 0
    };
  }

  loadFromFallback() {
    try {
      const raw = localStorage.getItem(DatabaseManager.FALLBACK_KEY);
      if (raw) {
        this.cache = JSON.parse(raw);
        if (!this.cache.customSubjects) this.cache.customSubjects = [];
        return;
      }
    } catch (e) {}

    // Clean initial state (unseeded)
    this.cache = {
      courses: [],
      tasks: [],
      flashcards: [],
      customSubjects: [],
      pomodoroStats: { completedSessions: 0, totalMinutes: 0, streakDays: 0 }
    };
  }

  // --- Unified Subject Management ---
  getAllSubjects() {
    const fromCourses = (this.cache.courses || []).map(c => c.name ? c.name.trim() : "").filter(Boolean);
    const fromCustom = (this.cache.customSubjects || []).map(s => s ? s.trim() : "").filter(Boolean);
    const combined = Array.from(new Set([...fromCourses, ...fromCustom]));
    return combined;
  }

  addSubject(subjectName) {
    const trimmed = (subjectName || "").trim();
    if (!trimmed) return;

    if (!this.cache.customSubjects) this.cache.customSubjects = [];
    if (!this.cache.customSubjects.includes(trimmed)) {
      this.cache.customSubjects.push(trimmed);
      if (this.isSqlJsReady && this.db) {
        try {
          this.db.run("INSERT OR IGNORE INTO custom_subjects (name, created_at) VALUES (?, ?)", [trimmed, Date.now()]);
        } catch (e) {}
      }
    }

    // Also register subject into courses table if not already present
    const existing = this.cache.courses.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (!existing) {
      const codeIndex = this.cache.courses.length + 1;
      const code = "SUB-" + String(codeIndex).padStart(2, '0');
      this.addCourse({
        id: "C-" + Date.now(),
        code: code,
        name: trimmed,
        credits: 4.0,
        grade: "A"
      });
    } else {
      this.persist();
    }
  }

  // --- Task Operations ---
  addTask(task) {
    this.cache.tasks.unshift(task);
    if (this.isSqlJsReady && this.db) {
      this.db.run(
        "INSERT INTO tasks (id, title, course, due_date, priority, hours, completed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [task.id, task.title, task.course, task.dueDate, task.priority, task.hours, task.completed ? 1 : 0, Date.now()]
      );
    }
    this.persist();
  }

  toggleTask(id) {
    const t = this.cache.tasks.find(x => x.id === id);
    if (t) {
      t.completed = !t.completed;
      if (this.isSqlJsReady && this.db) {
        this.db.run("UPDATE tasks SET completed = ? WHERE id = ?", [t.completed ? 1 : 0, id]);
      }
      this.persist();
    }
  }

  deleteTask(id) {
    this.cache.tasks = this.cache.tasks.filter(x => x.id !== id);
    if (this.isSqlJsReady && this.db) {
      this.db.run("DELETE FROM tasks WHERE id = ?", [id]);
    }
    this.persist();
  }

  // --- Course Operations ---
  addCourse(course) {
    const gradePoint = GRADE_POINTS[course.grade] ?? 0.0;
    course.gradePoint = gradePoint;
    this.cache.courses.push(course);
    if (this.isSqlJsReady && this.db) {
      this.db.run(
        "INSERT INTO courses (id, code, name, credits, grade, grade_point, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [course.id, course.code, course.name, course.credits, course.grade, gradePoint, Date.now()]
      );
    }
    this.persist();
  }

  deleteCourse(id) {
    this.cache.courses = this.cache.courses.filter(x => x.id !== id);
    if (this.isSqlJsReady && this.db) {
      this.db.run("DELETE FROM courses WHERE id = ?", [id]);
    }
    this.persist();
  }

  // --- Flashcard Operations ---
  addFlashcard(card) {
    this.cache.flashcards.push(card);
    if (this.isSqlJsReady && this.db) {
      this.db.run(
        "INSERT INTO flashcards (id, subject, question, answer, mastered, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [card.id, card.subject, card.question, card.answer, card.mastered ? 1 : 0, Date.now()]
      );
    }
    this.persist();
  }

  toggleFlashcardMastery(id) {
    const fc = this.cache.flashcards.find(x => x.id === id);
    if (fc) {
      fc.mastered = !fc.mastered;
      if (this.isSqlJsReady && this.db) {
        this.db.run("UPDATE flashcards SET mastered = ? WHERE id = ?", [fc.mastered ? 1 : 0, id]);
      }
      this.persist();
    }
  }

  // --- Pomodoro Operations ---
  logPomodoroSession(subject, duration) {
    this.cache.pomodoroStats.completedSessions++;
    this.cache.pomodoroStats.totalMinutes += duration;
    this.cache.pomodoroStats.streakDays = Math.max(1, this.cache.pomodoroStats.streakDays);

    if (this.isSqlJsReady && this.db) {
      const id = "PS-" + Date.now();
      this.db.run(
        "INSERT INTO pomodoro_sessions (id, subject, duration_minutes, completed_at) VALUES (?, ?, ?, ?)",
        [id, subject, duration, Date.now()]
      );
    }
    this.persist();
  }
}

// App Singleton Instance
const dbMgr = new DatabaseManager();

// ==========================================================================
// Initialization & Navigation
// ==========================================================================
document.addEventListener("DOMContentLoaded", async () => {
  await dbMgr.init();
  initTabs();
  initAssignments();
  initGpaCalculator();
  initPomodoro();
  initFlashcards();
  initAnalytics();
  updateSubjectSelectors();
  updateHeaderBadges();
});

function initTabs() {
  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      switchTab(tab.getAttribute("data-tab"));
    });
  });

  const hash = window.location.hash.replace("#", "");
  if (hash && ["assignments", "gpa", "pomodoro", "flashcards", "analytics"].includes(hash)) {
    switchTab(hash);
  }
}

function switchTab(tabName) {
  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach(t => {
    t.classList.toggle("active", t.getAttribute("data-tab") === tabName);
  });

  const targetPaneId = "tab-" + tabName;
  document.querySelectorAll(".tab-pane").forEach(pane => {
    pane.classList.toggle("active", pane.id === targetPaneId);
  });

  if (tabName === "analytics") {
    renderAnalytics();
  } else if (tabName === "pomodoro" || tabName === "gpa") {
    updateSubjectSelectors();
  }
}

function updateHeaderBadges() {
  const quickSgpa = document.getElementById("quickSgpa");
  const quickPending = document.getElementById("quickPending");
  const quickPomodoro = document.getElementById("quickPomodoro");

  const sgpa = calculateSgpa().sgpa;
  if (quickSgpa) quickSgpa.textContent = sgpa > 0 ? sgpa.toFixed(2) : "0.00";

  const pendingCount = dbMgr.cache.tasks.filter(t => !t.completed).length;
  if (quickPending) quickPending.textContent = pendingCount;

  if (quickPomodoro) quickPomodoro.textContent = dbMgr.cache.pomodoroStats.completedSessions;
}

// ==========================================================================
// Subject Selectors & Autocomplete Synchronization
// ==========================================================================
function updateSubjectSelectors(selectedSubject = null) {
  const subjects = dbMgr.getAllSubjects();

  // 1. Update Pomodoro Selector
  const pomoSelector = document.getElementById("pomoSubjectSelector");
  if (pomoSelector) {
    const prevValue = selectedSubject || pomoSelector.value;
    pomoSelector.innerHTML = "";

    if (subjects.length === 0) {
      const opt = document.createElement("option");
      opt.value = "General Focus";
      opt.textContent = "General Focus (Default)";
      pomoSelector.appendChild(opt);
    } else {
      subjects.forEach(sub => {
        const opt = document.createElement("option");
        opt.value = sub;
        opt.textContent = sub;
        pomoSelector.appendChild(opt);
      });
    }

    if (prevValue && subjects.includes(prevValue)) {
      pomoSelector.value = prevValue;
    }
  }

  // 2. Update Shared Datalist for Autocomplete
  const datalist = document.getElementById("subjectListDatalist");
  if (datalist) {
    datalist.innerHTML = subjects.map(s => `<option value="${escapeHtml(s)}">`).join("");
  }
}

// ==========================================================================
// Module 1: Assignments & Tasks
// ==========================================================================
function initAssignments() {
  const searchInput = document.getElementById("taskSearchInput");
  const priorityFilter = document.getElementById("priorityFilter");
  const statusFilter = document.getElementById("statusFilter");
  const btnSortUrgency = document.getElementById("btnSortUrgency");
  const btnOpenModal = document.getElementById("btnOpenTaskModal");
  const taskModal = document.getElementById("taskModal");
  const btnCloseModal = document.getElementById("btnCloseTaskModal");
  const btnCancelTask = document.getElementById("btnCancelTask");
  const taskForm = document.getElementById("taskForm");

  renderTasks();

  if (searchInput) searchInput.addEventListener("input", renderTasks);
  if (priorityFilter) priorityFilter.addEventListener("change", renderTasks);
  if (statusFilter) statusFilter.addEventListener("change", renderTasks);

  if (btnSortUrgency) {
    btnSortUrgency.addEventListener("click", () => {
      dbMgr.cache.tasks.sort((a, b) => {
        const pOrder = { "High": 1, "Medium": 2, "Low": 3 };
        if (pOrder[a.priority] !== pOrder[b.priority]) {
          return pOrder[a.priority] - pOrder[b.priority];
        }
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
      renderTasks();
    });
  }

  if (btnOpenModal) {
    btnOpenModal.addEventListener("click", () => {
      updateSubjectSelectors();
      taskModal.classList.add("active");
    });
  }
  const closeModal = () => taskModal.classList.remove("active");
  if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);
  if (btnCancelTask) btnCancelTask.addEventListener("click", closeModal);

  if (taskForm) {
    taskForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const courseSubject = document.getElementById("taskSubjectInput").value.trim();
      const newTask = {
        id: "T-" + (Date.now() % 100000),
        title: document.getElementById("taskTitleInput").value.trim(),
        course: courseSubject,
        dueDate: document.getElementById("taskDateInput").value,
        priority: document.getElementById("taskPriorityInput").value,
        hours: parseInt(document.getElementById("taskHoursInput").value, 10) || 3,
        completed: false
      };
      dbMgr.addTask(newTask);

      // Register subject into workspace subjects
      if (courseSubject) {
        dbMgr.addSubject(courseSubject);
        updateSubjectSelectors();
      }

      renderTasks();
      updateHeaderBadges();
      taskForm.reset();
      closeModal();
    });
  }
}

function renderTasks() {
  const taskList = document.getElementById("taskList");
  if (!taskList) return;

  const searchQuery = (document.getElementById("taskSearchInput")?.value || "").toLowerCase();
  const priorityVal = document.getElementById("priorityFilter")?.value || "ALL";
  const statusVal = document.getElementById("statusFilter")?.value || "ALL";

  const filtered = dbMgr.cache.tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery) || t.course.toLowerCase().includes(searchQuery);
    const matchesPriority = (priorityVal === "ALL" || t.priority === priorityVal);
    const matchesStatus = (statusVal === "ALL" || (statusVal === "COMPLETED" ? t.completed : !t.completed));
    return matchesSearch && matchesPriority && matchesStatus;
  });

  if (filtered.length === 0) {
    taskList.innerHTML = `
      <div class="empty-state-card">
        <p>No assignments recorded yet.</p>
        <div class="empty-state-action">
          <button class="btn btn-sm btn-primary" onclick="document.getElementById('taskModal').classList.add('active')">
            + New Assignment
          </button>
        </div>
      </div>
    `;
    return;
  }

  taskList.innerHTML = filtered.map(t => `
    <div class="task-card ${t.completed ? 'completed' : ''}" data-id="${t.id}">
      <div class="task-card-header">
        <div>
          <h2 class="task-title">${escapeHtml(t.title)}</h2>
          <p class="task-course">${escapeHtml(t.course)}</p>
        </div>
        <span class="priority-tag priority-${t.priority.toLowerCase()}">${t.priority}</span>
      </div>
      <div class="task-meta-row">
        <span>Due ${t.dueDate}</span>
        <span>${t.hours} hrs est.</span>
      </div>
      <div class="task-footer-actions">
        <button class="btn btn-sm btn-secondary" onclick="toggleTaskComplete('${t.id}')">
          ${t.completed ? 'Reopen' : 'Mark Completed'}
        </button>
        <button class="btn btn-sm btn-ghost" onclick="deleteTaskItem('${t.id}')">
          Delete
        </button>
      </div>
    </div>
  `).join("");
}

window.toggleTaskComplete = function(id) {
  dbMgr.toggleTask(id);
  renderTasks();
  updateHeaderBadges();
};

window.deleteTaskItem = function(id) {
  dbMgr.deleteTask(id);
  renderTasks();
  updateHeaderBadges();
};

// ==========================================================================
// Module 2: SGPA Grade Calculator
// ==========================================================================
function calculateSgpa() {
  let totalCredits = 0;
  let totalWeighted = 0;
  dbMgr.cache.courses.forEach(c => {
    const pt = GRADE_POINTS[c.grade] ?? c.gradePoint ?? 0.0;
    totalCredits += c.credits;
    totalWeighted += (c.credits * pt);
  });
  const sgpa = totalCredits > 0 ? (totalWeighted / totalCredits) : 0.0;
  return { sgpa, totalCredits, totalWeighted };
}

function initGpaCalculator() {
  const btnOpenModal = document.getElementById("btnOpenCourseModal");
  const courseModal = document.getElementById("courseModal");
  const btnCloseModal = document.getElementById("btnCloseCourseModal");
  const btnCancelCourse = document.getElementById("btnCancelCourse");
  const courseForm = document.getElementById("courseForm");
  const btnSimulate = document.getElementById("btnSimulate");

  renderCourseTable();

  if (btnOpenModal) {
    btnOpenModal.addEventListener("click", () => {
      updateSubjectSelectors();
      courseModal.classList.add("active");
    });
  }
  const closeModal = () => courseModal.classList.remove("active");
  if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);
  if (btnCancelCourse) btnCancelCourse.addEventListener("click", closeModal);

  if (courseForm) {
    courseForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const courseName = document.getElementById("courseNameInput").value.trim();
      const newCourse = {
        id: "C-" + (Date.now() % 100000),
        code: document.getElementById("courseCodeInput").value.trim(),
        name: courseName,
        credits: parseFloat(document.getElementById("courseCreditsInput").value),
        grade: document.getElementById("courseGradeInput").value
      };
      dbMgr.addCourse(newCourse);
      dbMgr.addSubject(courseName);

      renderCourseTable();
      updateSubjectSelectors();
      updateHeaderBadges();
      courseForm.reset();
      closeModal();
    });
  }

  if (btnSimulate) {
    btnSimulate.addEventListener("click", runTargetSimulation);
  }
}

function renderCourseTable() {
  const tbody = document.getElementById("courseTableBody");
  if (!tbody) return;

  const { sgpa, totalCredits, totalWeighted } = calculateSgpa();

  const dispSgpa = document.getElementById("dispSgpa");
  const dispClassification = document.getElementById("dispClassification");
  const dispTotalCredits = document.getElementById("dispTotalCredits");
  const dispWeightedPoints = document.getElementById("dispWeightedPoints");

  if (dispSgpa) dispSgpa.textContent = sgpa > 0 ? sgpa.toFixed(2) : "0.00";
  if (dispTotalCredits) dispTotalCredits.textContent = totalCredits.toFixed(1);
  if (dispWeightedPoints) dispWeightedPoints.textContent = totalWeighted.toFixed(1);

  if (dispClassification) {
    if (totalCredits === 0) {
      dispClassification.textContent = "No courses enrolled";
      dispClassification.className = "status-tag tag-neutral";
    } else if (sgpa >= 9.0) {
      dispClassification.textContent = "First Class With Distinction";
      dispClassification.className = "status-tag tag-green";
    } else if (sgpa >= 8.0) {
      dispClassification.textContent = "First Class With Honors";
      dispClassification.className = "status-tag tag-neutral";
    } else if (sgpa >= 6.5) {
      dispClassification.textContent = "First Class";
      dispClassification.className = "status-tag tag-neutral";
    } else {
      dispClassification.textContent = "Passing Standing";
      dispClassification.className = "status-tag tag-neutral";
    }
  }

  if (dbMgr.cache.courses.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state-cell">
          No courses added yet. Click "+ Add Course" to register modules and calculate your SGPA.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = dbMgr.cache.courses.map(c => {
    const pt = GRADE_POINTS[c.grade] ?? 0.0;
    const weighted = (c.credits * pt).toFixed(1);
    return `
      <tr>
        <td><span class="code-pill">${escapeHtml(c.code)}</span></td>
        <td>${escapeHtml(c.name)}</td>
        <td style="text-align: right;">${c.credits.toFixed(1)}</td>
        <td style="text-align: center;"><span class="status-tag tag-neutral">${c.grade}</span></td>
        <td style="text-align: right;">${pt.toFixed(1)}</td>
        <td style="text-align: right;"><strong>${weighted}</strong></td>
        <td style="text-align: right;">
          <button class="btn btn-sm btn-ghost" onclick="deleteCourseItem('${c.id}')">
            Remove
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

window.deleteCourseItem = function(id) {
  dbMgr.deleteCourse(id);
  renderCourseTable();
  updateSubjectSelectors();
  updateHeaderBadges();
};

function runTargetSimulation() {
  const target = parseFloat(document.getElementById("simTargetInput")?.value || 0);
  const simResultBox = document.getElementById("simResultBox");
  if (!simResultBox) return;

  const { sgpa, totalCredits, totalWeighted } = calculateSgpa();
  if (totalCredits === 0) {
    simResultBox.textContent = "Add courses first to simulate target grades.";
    return;
  }

  const diff = target - sgpa;
  if (diff <= 0) {
    simResultBox.innerHTML = `Target Achieved: Current SGPA (${sgpa.toFixed(2)}) meets or exceeds your goal (${target.toFixed(2)}).`;
  } else {
    const requiredTotal = target * (totalCredits + 4);
    const neededOnNext = requiredTotal - totalWeighted;
    const gradeNeeded = (neededOnNext / 4).toFixed(1);
    simResultBox.innerHTML = `To reach <strong>${target.toFixed(2)}</strong>, you need an average grade point of <strong>${gradeNeeded} / 10</strong> on the next 4-credit course.`;
  }
}

// ==========================================================================
// Module 3: Pomodoro Focus Timer (Editable Duration & Custom Subjects)
// ==========================================================================
let timerInterval = null;
let initialSeconds = 25 * 60;
let timerSeconds = 25 * 60;
let isTimerRunning = false;
let currentTimerMode = "focus";

function initPomodoro() {
  const btnStart = document.getElementById("btnTimerStart");
  const btnPause = document.getElementById("btnTimerPause");
  const btnReset = document.getElementById("btnTimerReset");
  const modeBtns = document.querySelectorAll(".mode-btn");
  const customInput = document.getElementById("customTimerMinutes");
  const btnApplyDuration = document.getElementById("btnApplyDuration");
  const btnAddSubject = document.getElementById("btnAddPomoSubject");
  const newSubjectInput = document.getElementById("pomoNewSubjectInput");

  // Mode preset buttons
  modeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      modeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const mode = btn.getAttribute("data-mode");
      const mins = parseInt(btn.getAttribute("data-time"), 10);

      if (customInput) customInput.value = mins;
      setTimerDuration(mode, mins);
    });
  });

  // Custom duration setter
  const applyCustomDuration = () => {
    if (!customInput) return;
    let mins = parseInt(customInput.value, 10);
    if (isNaN(mins) || mins < 1) mins = 1;
    if (mins > 180) mins = 180;
    customInput.value = mins;

    // Remove active from presets if not matching standard preset
    modeBtns.forEach(b => {
      const bMins = parseInt(b.getAttribute("data-time"), 10);
      b.classList.toggle("active", bMins === mins);
    });

    setTimerDuration("focus", mins);
  };

  if (btnApplyDuration) btnApplyDuration.addEventListener("click", applyCustomDuration);
  if (customInput) {
    customInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyCustomDuration();
      }
    });
  }

  // Add custom subject button
  const handleAddNewSubject = () => {
    if (!newSubjectInput) return;
    const name = newSubjectInput.value.trim();
    if (!name) return;

    dbMgr.addSubject(name);
    updateSubjectSelectors(name);
    renderCourseTable();
    updateHeaderBadges();
    newSubjectInput.value = "";
  };

  if (btnAddSubject) btnAddSubject.addEventListener("click", handleAddNewSubject);
  if (newSubjectInput) {
    newSubjectInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddNewSubject();
      }
    });
  }

  if (btnStart) btnStart.addEventListener("click", startTimer);
  if (btnPause) btnPause.addEventListener("click", pauseTimer);
  if (btnReset) btnReset.addEventListener("click", resetTimer);

  updateTimerDisplay();
  updatePomodoroStats();
}

function setTimerDuration(mode, minutes) {
  pauseTimer();
  currentTimerMode = mode;
  initialSeconds = minutes * 60;
  timerSeconds = initialSeconds;

  const modeLabel = document.getElementById("timerModeLabel");
  if (modeLabel) {
    if (mode === "shortBreak") modeLabel.textContent = `Short Break (${minutes}m)`;
    else if (mode === "longBreak") modeLabel.textContent = `Long Break (${minutes}m)`;
    else modeLabel.textContent = `Focus Interval (${minutes}m)`;
  }

  updateTimerDisplay();
}

function startTimer() {
  if (isTimerRunning) return;
  isTimerRunning = true;
  document.getElementById("btnTimerStart").disabled = true;
  document.getElementById("btnTimerPause").disabled = false;

  timerInterval = setInterval(() => {
    if (timerSeconds > 0) {
      timerSeconds--;
      updateTimerDisplay();
    } else {
      clearInterval(timerInterval);
      isTimerRunning = false;
      document.getElementById("btnTimerStart").disabled = false;
      document.getElementById("btnTimerPause").disabled = true;

      if (currentTimerMode === "focus") {
        const subjectSelector = document.getElementById("pomoSubjectSelector");
        const subject = subjectSelector ? subjectSelector.value : "General Focus";
        dbMgr.logPomodoroSession(subject, Math.round(initialSeconds / 60));
        updatePomodoroStats();
        updateHeaderBadges();
      }
      resetTimer();
    }
  }, 1000);
}

function pauseTimer() {
  if (!isTimerRunning) return;
  clearInterval(timerInterval);
  isTimerRunning = false;
  document.getElementById("btnTimerStart").disabled = false;
  document.getElementById("btnTimerPause").disabled = true;
}

function resetTimer() {
  pauseTimer();
  timerSeconds = initialSeconds;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const m = Math.floor(timerSeconds / 60);
  const s = timerSeconds % 60;
  const str = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  const disp = document.getElementById("timerDisplay");
  if (disp) disp.textContent = str;

  const ring = document.getElementById("timerProgress");
  if (ring) {
    const totalCircumference = 2 * Math.PI * 104; // r = 104
    const fraction = initialSeconds > 0 ? (timerSeconds / initialSeconds) : 0;
    const offset = totalCircumference * (1 - fraction);
    ring.style.strokeDashoffset = offset;
  }
}

function updatePomodoroStats() {
  const pomoCount = document.getElementById("pomoCount");
  const pomoMinutes = document.getElementById("pomoMinutes");
  const pomoStreak = document.getElementById("pomoStreak");

  if (pomoCount) pomoCount.textContent = dbMgr.cache.pomodoroStats.completedSessions;
  if (pomoMinutes) pomoMinutes.textContent = `${dbMgr.cache.pomodoroStats.totalMinutes}m`;
  if (pomoStreak) pomoStreak.textContent = dbMgr.cache.pomodoroStats.streakDays;
}

// ==========================================================================
// Module 4: Revision Flashcards
// ==========================================================================
let currentCardIndex = 0;

function initFlashcards() {
  const cardInner = document.getElementById("cardInner");
  const btnFlip = document.getElementById("btnFcFlip");
  const btnPrev = document.getElementById("btnFcPrev");
  const btnNext = document.getElementById("btnFcNext");
  const btnMaster = document.getElementById("btnFcMaster");
  const btnOpenModal = document.getElementById("btnOpenFlashcardModal");
  const modal = document.getElementById("flashcardModal");
  const btnClose = document.getElementById("btnCloseFcModal");
  const btnCancel = document.getElementById("btnCancelFc");
  const form = document.getElementById("flashcardForm");

  const toggleFlip = () => cardInner.classList.toggle("flipped");

  if (cardInner) cardInner.addEventListener("click", toggleFlip);
  if (btnFlip) btnFlip.addEventListener("click", toggleFlip);

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && document.getElementById("tab-flashcards")?.classList.contains("active") && !document.querySelector(".modal-backdrop.active")) {
      e.preventDefault();
      toggleFlip();
    }
  });

  if (btnPrev) {
    btnPrev.addEventListener("click", () => {
      if (dbMgr.cache.flashcards.length === 0) return;
      cardInner.classList.remove("flipped");
      currentCardIndex = (currentCardIndex - 1 + dbMgr.cache.flashcards.length) % dbMgr.cache.flashcards.length;
      renderActiveCard();
    });
  }

  if (btnNext) {
    btnNext.addEventListener("click", () => {
      if (dbMgr.cache.flashcards.length === 0) return;
      cardInner.classList.remove("flipped");
      currentCardIndex = (currentCardIndex + 1) % dbMgr.cache.flashcards.length;
      renderActiveCard();
    });
  }

  if (btnMaster) {
    btnMaster.addEventListener("click", () => {
      if (dbMgr.cache.flashcards.length > 0) {
        const c = dbMgr.cache.flashcards[currentCardIndex];
        dbMgr.toggleFlashcardMastery(c.id);
        renderActiveCard();
      }
    });
  }

  if (btnOpenModal) {
    btnOpenModal.addEventListener("click", () => {
      updateSubjectSelectors();
      modal.classList.add("active");
    });
  }
  const closeFcModal = () => modal.classList.remove("active");
  if (btnClose) btnClose.addEventListener("click", closeFcModal);
  if (btnCancel) btnCancel.addEventListener("click", closeFcModal);

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const topicSubject = document.getElementById("fcSubjectInput").value.trim();
      const newCard = {
        id: "FC-" + (Date.now() % 100000),
        subject: topicSubject,
        question: document.getElementById("fcQuestionInput").value.trim(),
        answer: document.getElementById("fcAnswerInput").value.trim(),
        mastered: false
      };
      dbMgr.addFlashcard(newCard);

      if (topicSubject) {
        dbMgr.addSubject(topicSubject);
        updateSubjectSelectors();
      }

      currentCardIndex = dbMgr.cache.flashcards.length - 1;
      cardInner.classList.remove("flipped");
      renderActiveCard();
      form.reset();
      closeFcModal();
    });
  }

  renderActiveCard();
}

function renderActiveCard() {
  const fcSubject = document.getElementById("fcSubject");
  const fcCounter = document.getElementById("fcCounter");
  const fcQuestion = document.getElementById("fcQuestion");
  const fcAnswer = document.getElementById("fcAnswer");
  const fcMasteryTag = document.getElementById("fcMasteryTag");
  const fcMasterBtnText = document.getElementById("fcMasterBtnText");

  if (dbMgr.cache.flashcards.length === 0) {
    if (fcSubject) fcSubject.textContent = "Active Recall";
    if (fcCounter) fcCounter.textContent = "0 Cards";
    if (fcQuestion) fcQuestion.textContent = "No revision flashcards added yet. Click '+ New Card' to add concept prompts for active recall.";
    if (fcAnswer) fcAnswer.textContent = "Answers will appear here once cards are created.";
    if (fcMasteryTag) fcMasteryTag.textContent = "Empty";
    if (fcMasterBtnText) fcMasterBtnText.textContent = "Mark Mastered";
    return;
  }

  const card = dbMgr.cache.flashcards[currentCardIndex];
  if (!card) return;

  if (fcSubject) fcSubject.textContent = card.subject;
  if (fcCounter) fcCounter.textContent = `Card ${currentCardIndex + 1} of ${dbMgr.cache.flashcards.length}`;
  if (fcQuestion) fcQuestion.textContent = card.question;
  if (fcAnswer) fcAnswer.textContent = card.answer;

  if (card.mastered) {
    if (fcMasteryTag) {
      fcMasteryTag.textContent = "Mastered";
      fcMasteryTag.style.color = "var(--accent)";
    }
    if (fcMasterBtnText) fcMasterBtnText.textContent = "Mastered";
  } else {
    if (fcMasteryTag) {
      fcMasteryTag.textContent = "Unmastered";
      fcMasteryTag.style.color = "var(--text-muted)";
    }
    if (fcMasterBtnText) fcMasterBtnText.textContent = "Mark Mastered";
  }
}

// ==========================================================================
// Module 5: Analytics & Data Export
// ==========================================================================
function initAnalytics() {
  const btnExportTxt = document.getElementById("btnExportTxt");
  const btnExportJson = document.getElementById("btnExportJson");

  if (btnExportTxt) btnExportTxt.addEventListener("click", downloadTextReport);
  if (btnExportJson) btnExportJson.addEventListener("click", downloadJsonBackup);
}

function renderAnalytics() {
  const statCourseCount = document.getElementById("statCourseCount");
  const statTaskCount = document.getElementById("statTaskCount");
  const statMasteredCount = document.getElementById("statMasteredCount");
  const statStudyMins = document.getElementById("statStudyMins");
  const reportPreviewBox = document.getElementById("reportPreviewBox");

  if (statCourseCount) statCourseCount.textContent = dbMgr.cache.courses.length;
  if (statTaskCount) statTaskCount.textContent = dbMgr.cache.tasks.length;

  const mastered = dbMgr.cache.flashcards.filter(f => f.mastered).length;
  if (statMasteredCount) statMasteredCount.textContent = `${mastered} / ${dbMgr.cache.flashcards.length}`;

  if (statStudyMins) statStudyMins.textContent = `${dbMgr.cache.pomodoroStats.totalMinutes}m`;

  const report = generateReportText();
  if (reportPreviewBox) reportPreviewBox.textContent = report;
}

function generateReportText() {
  const { sgpa, totalCredits } = calculateSgpa();
  const dateStr = new Date().toISOString().split('T')[0];

  return `================================================================================
                    STUDENT WORKSPACE • ACADEMIC REPORT
================================================================================
Generated Date:   ${dateStr}
Workspace:        Student Workspace
Current SGPA:     ${sgpa.toFixed(2)} / 10.00
Enrolled Credits: ${totalCredits.toFixed(1)} Credits
Study Time:       ${dbMgr.cache.pomodoroStats.totalMinutes} minutes (${dbMgr.cache.pomodoroStats.completedSessions} focus blocks)
Database:         SQLite WebAssembly Engine (Local Client-Side Storage)
================================================================================

1. REGISTERED SEMESTER COURSES:
--------------------------------------------------------------------------------
Code          Course Title                              Credits   Grade   Points
--------------------------------------------------------------------------------
${dbMgr.cache.courses.length === 0 ? "No courses recorded yet." : dbMgr.cache.courses.map(c => {
  const pt = (GRADE_POINTS[c.grade] ?? 0.0).toFixed(1);
  return `${c.code.padEnd(13)} ${c.name.padEnd(41)} ${c.credits.toFixed(1).padEnd(9)} ${c.grade.padEnd(7)} ${pt}`;
}).join('\n')}
--------------------------------------------------------------------------------

2. ASSIGNMENTS & DELIVERABLES:
--------------------------------------------------------------------------------
Title                                    Course                  Due Date     Priority
--------------------------------------------------------------------------------
${dbMgr.cache.tasks.length === 0 ? "No assignments recorded yet." : dbMgr.cache.tasks.map(t => {
  const status = t.completed ? "[DONE]" : "[DUE] ";
  return `${status} ${t.title.padEnd(35)} ${t.course.padEnd(23)} ${t.dueDate.padEnd(12)} ${t.priority}`;
}).join('\n')}
--------------------------------------------------------------------------------

3. FLASHCARDS RETENTION:
Total Cards:      ${dbMgr.cache.flashcards.length}
Mastered Topics:  ${dbMgr.cache.flashcards.filter(f => f.mastered).length}
================================================================================`;
}

function downloadTextReport() {
  const report = generateReportText();
  downloadBlob(report, "Student_Workspace_Academic_Report.txt", "text/plain");
}

function downloadJsonBackup() {
  const jsonStr = JSON.stringify(dbMgr.cache, null, 2);
  downloadBlob(jsonStr, "student_workspace_backup.json", "application/json");
}

function downloadBlob(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
