import React, { useState, useEffect, useMemo, useRef } from "react";
import Head from "next/head";
import { getDb } from "../lib/db";

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

export default function Home({ initialData }) {
  // Local state initialized from SQLite Database
  const [activeTab, setActiveTab] = useState("assignments");
  const [courses, setCourses] = useState(initialData?.courses || []);
  const [tasks, setTasks] = useState(initialData?.tasks || []);
  const [flashcards, setFlashcards] = useState(initialData?.flashcards || []);
  const [pomodoroStats, setPomodoroStats] = useState(initialData?.pomodoro || { completedSessions: 4, totalMinutes: 100, streakDays: 4 });

  // Filtering & search
  const [taskSearch, setTaskSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // GPA Simulator
  const [simTarget, setSimTarget] = useState("9.50");
  const [simMessage, setSimMessage] = useState(null);

  // Pomodoro Timer State
  const [timerMode, setTimerMode] = useState("focus");
  const [initialMinutes, setInitialMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [selectedPomoCourse, setSelectedPomoCourse] = useState("Object Oriented Programming");

  // Flashcards state
  const [currentFcIndex, setCurrentFcIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Modals
  const [modalTaskOpen, setModalTaskOpen] = useState(false);
  const [modalCourseOpen, setModalCourseOpen] = useState(false);
  const [modalFcOpen, setModalFcOpen] = useState(false);

  // Form states
  const [newTask, setNewTask] = useState({ title: "", course: "", dueDate: "", priority: "Medium", hours: 3 });
  const [newCourse, setNewCourse] = useState({ code: "", name: "", credits: "4.0", grade: "A" });
  const [newFc, setNewFc] = useState({ subject: "", question: "", answer: "" });

  // Compute SGPA dynamically
  const { sgpa, totalCredits, totalWeighted } = useMemo(() => {
    let creds = 0;
    let weighted = 0;
    courses.forEach(c => {
      const pt = GRADE_POINTS[c.grade] ?? c.gradePoint ?? 0.0;
      creds += c.credits;
      weighted += (c.credits * pt);
    });
    return {
      sgpa: creds > 0 ? (weighted / creds) : 0.0,
      totalCredits: creds,
      totalWeighted: weighted
    };
  }, [courses]);

  // Pomodoro interval ticker
  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev > 1) return prev - 1;
          clearInterval(interval);
          handleTimerComplete();
          return 0;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerMode, selectedPomoCourse]);

  const handleTimerComplete = async () => {
    setIsTimerRunning(false);
    if (timerMode === "focus") {
      try {
        await fetch("/api/pomodoro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject: selectedPomoCourse, durationMinutes: initialMinutes })
        });
        setPomodoroStats(prev => ({
          completedSessions: prev.completedSessions + 1,
          totalMinutes: prev.totalMinutes + initialMinutes,
          streakDays: prev.streakDays + 1
        }));
      } catch (err) {
        console.error("Failed to log pomodoro to database:", err);
      }
      alert("Focus interval completed. Take a five-minute rest.");
    } else {
      alert("Break completed. Ready for the next focus sprint?");
    }
    setTimerSeconds(initialMinutes * 60);
  };

  const setPomoMode = (mode, mins) => {
    setIsTimerRunning(false);
    setTimerMode(mode);
    setInitialMinutes(mins);
    setTimerSeconds(mins * 60);
  };

  // Keyboard shortcut for flashcards (Spacebar to flip)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space" && activeTab === "flashcards" && !modalTaskOpen && !modalCourseOpen && !modalFcOpen) {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, modalTaskOpen, modalCourseOpen, modalFcOpen]);

  // Task Handlers
  const handleToggleTask = async (id, currentCompleted) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !currentCompleted } : t));
    try {
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, completed: !currentCompleted })
      });
    } catch (e) {
      console.error("Task toggle error:", e);
    }
  };

  const handleDeleteTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await fetch(`/api/tasks?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch (e) {
      console.error("Task delete error:", e);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const createdId = "T-" + Date.now();
    const taskObj = { ...newTask, id: createdId, hours: Number(newTask.hours), completed: false };
    setTasks(prev => [taskObj, ...prev]);
    setModalTaskOpen(false);
    setNewTask({ title: "", course: "", dueDate: "", priority: "Medium", hours: 3 });

    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskObj)
      });
    } catch (e) {
      console.error("Task create error:", e);
    }
  };

  const handleSortTasks = () => {
    setTasks(prev => [...prev].sort((a, b) => {
      const pMap = { High: 1, Medium: 2, Low: 3 };
      if (pMap[a.priority] !== pMap[b.priority]) return pMap[a.priority] - pMap[b.priority];
      return new Date(a.dueDate) - new Date(b.dueDate);
    }));
  };

  // Course Handlers
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    const createdId = "C-" + Date.now();
    const pt = GRADE_POINTS[newCourse.grade] || 0.0;
    const courseObj = {
      id: createdId,
      code: newCourse.code.trim(),
      name: newCourse.name.trim(),
      credits: parseFloat(newCourse.credits),
      grade: newCourse.grade,
      gradePoint: pt
    };
    setCourses(prev => [...prev, courseObj]);
    setModalCourseOpen(false);
    setNewCourse({ code: "", name: "", credits: "4.0", grade: "A" });

    try {
      await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseObj)
      });
    } catch (e) {
      console.error("Course create error:", e);
    }
  };

  const handleDeleteCourse = async (id) => {
    setCourses(prev => prev.filter(c => c.id !== id));
    try {
      await fetch(`/api/courses?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch (e) {
      console.error("Course delete error:", e);
    }
  };

  // Flashcard Handlers
  const handleToggleMastered = async () => {
    if (flashcards.length === 0) return;
    const active = flashcards[currentFcIndex];
    const newMastered = !active.mastered;
    setFlashcards(prev => prev.map((f, i) => i === currentFcIndex ? { ...f, mastered: newMastered } : f));

    try {
      await fetch("/api/flashcards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: active.id, mastered: newMastered })
      });
    } catch (e) {
      console.error("Flashcard toggle error:", e);
    }
  };

  const handleCreateFlashcard = async (e) => {
    e.preventDefault();
    const cardObj = {
      id: "FC-" + Date.now(),
      subject: newFc.subject.trim(),
      question: newFc.question.trim(),
      answer: newFc.answer.trim(),
      mastered: false
    };
    setFlashcards(prev => [...prev, cardObj]);
    setCurrentFcIndex(flashcards.length);
    setIsFlipped(false);
    setModalFcOpen(false);
    setNewFc({ subject: "", question: "", answer: "" });

    try {
      await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cardObj)
      });
    } catch (e) {
      console.error("Flashcard create error:", e);
    }
  };

  // GPA Target simulation
  const handleCalculateTarget = () => {
    const target = parseFloat(simTarget);
    if (!target || totalCredits === 0) return;
    const diff = target - sgpa;
    if (diff <= 0) {
      setSimMessage({
        type: "success",
        text: `Target achieved. Current SGPA (${sgpa.toFixed(2)}) meets or exceeds target (${target.toFixed(2)}).`
      });
    } else {
      const neededPoints = (target * (totalCredits + 4)) - totalWeighted;
      const gradeReq = (neededPoints / 4).toFixed(1);
      setSimMessage({
        type: "info",
        text: `To achieve ${target.toFixed(2)}, an average of ${gradeReq} / 10.0 grade points is required on upcoming modules.`
      });
    }
  };

  // Downloads
  const downloadTextReport = () => {
    const text = `================================================================================
                    STUDENT WORKSPACE • ACADEMIC REPORT
================================================================================
Generated Date:   ${new Date().toISOString().split('T')[0]}
Workspace:        Student Workspace
Current SGPA:     ${sgpa.toFixed(2)} / 10.00
Enrolled Credits: ${totalCredits.toFixed(1)} Credits
Study Time:       ${pomodoroStats.totalMinutes} minutes (${pomodoroStats.completedSessions} focus blocks)
Local Database:   SQLite WebAssembly Engine
================================================================================

1. REGISTERED SEMESTER COURSES:
--------------------------------------------------------------------------------
Code          Course Title                              Credits   Grade   Points
--------------------------------------------------------------------------------
${courses.length === 0 ? "No courses recorded yet." : courses.map(c => `${c.code.padEnd(13)} ${c.name.padEnd(41)} ${c.credits.toFixed(1).padEnd(9)} ${c.grade.padEnd(7)} ${(GRADE_POINTS[c.grade] || 0).toFixed(1)}`).join('\n')}
--------------------------------------------------------------------------------

2. ASSIGNMENTS & DELIVERABLES:
--------------------------------------------------------------------------------
Title                                    Course                  Due Date     Priority
--------------------------------------------------------------------------------
${tasks.length === 0 ? "No assignments recorded yet." : tasks.map(t => `${(t.completed ? '[DONE]' : '[DUE] ').padEnd(7)} ${t.title.padEnd(35)} ${t.course.padEnd(23)} ${t.dueDate.padEnd(12)} ${t.priority}`).join('\n')}
--------------------------------------------------------------------------------

3. FLASHCARDS RETENTION:
Total Cards:      ${flashcards.length}
Mastered Topics:  ${flashcards.filter(f => f.mastered).length}
================================================================================`;

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Student_Workspace_Academic_Report.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJsonBackup = () => {
    const payload = JSON.stringify({ courses, tasks, flashcards, pomodoroStats }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_suite_backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    const q = taskSearch.toLowerCase();
    return tasks.filter(t => {
      const matchQ = t.title.toLowerCase().includes(q) || t.course.toLowerCase().includes(q);
      const matchP = priorityFilter === "ALL" || t.priority === priorityFilter;
      const matchS = statusFilter === "ALL" || (statusFilter === "COMPLETED" ? t.completed : !t.completed);
      return matchQ && matchP && matchS;
    });
  }, [tasks, taskSearch, priorityFilter, statusFilter]);

  // Pomodoro SVG calculations
  const totalCircumference = 2 * Math.PI * 104; // r = 104 -> ~653.45
  const timerFraction = timerSeconds / (initialMinutes * 60);
  const ringOffset = totalCircumference * (1 - timerFraction);

  const formatTimerDigits = () => {
    const m = Math.floor(timerSeconds / 60);
    const s = timerSeconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const pendingTaskCount = tasks.filter(t => !t.completed).length;
  const currentCard = flashcards[currentFcIndex] || null;

  return (
    <>
      <Head>
        <title>Student Workspace</title>
        <meta name="description" content="A calm, offline-first academic productivity workspace powered by local SQLite." />
      </Head>

      <div className="app-layout">
        {/* Top Header */}
        <header className="app-header">
          <div className="header-left">
            <span className="brand-title">StudentWorkspace</span>
          </div>

          <div className="header-right">
            <div className="status-metric">
              <span className="metric-label">SGPA</span>
              <span className="metric-value">{sgpa.toFixed(2)}</span>
            </div>
            <div className="status-divider"></div>
            <div className="status-metric">
              <span className="metric-label">Due Soon</span>
              <span className="metric-value">{pendingTaskCount}</span>
            </div>
            <div className="status-divider"></div>
            <div className="status-metric">
              <span className="metric-label">Focus Blocks</span>
              <span className="metric-value">{pomodoroStats.completedSessions}</span>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="app-nav">
          <div className="nav-container">
            <div className="nav-tabs">
              <button className={`nav-tab ${activeTab === "assignments" ? "active" : ""}`} onClick={() => setActiveTab("assignments")}>Assignments</button>
              <button className={`nav-tab ${activeTab === "gpa" ? "active" : ""}`} onClick={() => setActiveTab("gpa")}>SGPA Calculator</button>
              <button className={`nav-tab ${activeTab === "pomodoro" ? "active" : ""}`} onClick={() => setActiveTab("pomodoro")}>Focus Timer</button>
              <button className={`nav-tab ${activeTab === "flashcards" ? "active" : ""}`} onClick={() => setActiveTab("flashcards")}>Revision Flashcards</button>
              <button className={`nav-tab ${activeTab === "analytics" ? "active" : ""}`} onClick={() => setActiveTab("analytics")}>Summary &amp; Export</button>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="app-main">

          {/* ==================== TAB 1: ASSIGNMENTS ==================== */}
          {activeTab === "assignments" && (
            <section className="tab-pane active">
              <div className="section-header">
                <div>
                  <h1 className="section-title">Assignments and deadlines</h1>
                  <p className="section-desc">Track and prioritize coursework with due dates and estimated workload.</p>
                </div>
                <div className="section-actions">
                  <button className="btn btn-secondary" onClick={handleSortTasks}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M7 15l5 5 5-5M7 9l5-5 5 5"/></svg>
                    <span>Sort by priority</span>
                  </button>
                  <button className="btn btn-primary" onClick={() => setModalTaskOpen(true)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    <span>New assignment</span>
                  </button>
                </div>
              </div>

              {/* Filter Panel */}
              <div className="filter-panel">
                <div className="search-field">
                  <svg className="field-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input
                    type="text"
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    placeholder="Search assignments or courses"
                  />
                </div>
                <div className="filter-controls">
                  <div className="select-wrapper">
                    <label className="select-label">Priority</label>
                    <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="form-select-sm">
                      <option value="ALL">All priorities</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div className="select-wrapper">
                    <label className="select-label">Status</label>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-select-sm">
                      <option value="ALL">All status</option>
                      <option value="PENDING">Pending</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tasks Grid */}
              <div className="task-grid">
                {filteredTasks.length === 0 ? (
                  <div style={{ gridColumn: "1/-1", padding: "32px", textAlign: "center", color: "var(--text-muted)", background: "white", borderRadius: "var(--radius-card)", border: "1px dashed var(--border-hairline)" }}>
                    <p>No assignments found matching current filter criteria.</p>
                  </div>
                ) : (
                  filteredTasks.map(t => (
                    <div key={t.id} className={`task-card ${t.completed ? "completed" : ""}`}>
                      <div className="task-card-header">
                        <div>
                          <h2 className="task-title">{t.title}</h2>
                          <p className="task-course">{t.course}</p>
                        </div>
                        <span className={`priority-tag priority-${t.priority.toLowerCase()}`}>{t.priority}</span>
                      </div>
                      <div className="task-meta-row">
                        <span>Due {t.dueDate}</span>
                        <span>{t.hours} hrs est.</span>
                      </div>
                      <div className="task-footer-actions">
                        <button className="btn btn-sm btn-secondary" onClick={() => handleToggleTask(t.id, t.completed)}>
                          {t.completed ? "Reopen" : "Mark completed"}
                        </button>
                        <button className="btn btn-sm btn-ghost" onClick={() => handleDeleteTask(t.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {/* ==================== TAB 2: GPA CALCULATOR ==================== */}
          {activeTab === "gpa" && (
            <section className="tab-pane active">
              <div className="section-header">
                <div>
                  <h1 className="section-title">SGPA and grade calculation</h1>
                  <p className="section-desc">Weighted credit point calculations based on the standard 10-point scale.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setModalCourseOpen(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <span>Add course</span>
                </button>
              </div>

              <div className="gpa-overview-grid">
                <div className="card gpa-metric-card">
                  <div className="metric-top">
                    <span className="card-caption">Semester SGPA</span>
                    <span className="status-tag tag-green">
                      {sgpa >= 9.0 ? "First class with distinction" : sgpa >= 8.0 ? "First class with honors" : sgpa >= 6.5 ? "First class" : "Passing standing"}
                    </span>
                  </div>
                  <div className="gpa-display-row">
                    <span className="gpa-large-number">{sgpa.toFixed(2)}</span>
                    <span className="gpa-max-scale">/ 10.00</span>
                  </div>
                  <div className="gpa-breakdown-row">
                    <div className="breakdown-item">
                      <span className="breakdown-label">Registered credits</span>
                      <span className="breakdown-val">{totalCredits.toFixed(1)}</span>
                    </div>
                    <div className="breakdown-item">
                      <span className="breakdown-label">Weighted points</span>
                      <span className="breakdown-val">{totalWeighted.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="card gpa-simulator-card">
                  <div className="metric-top">
                    <span className="card-caption">Target SGPA simulator</span>
                    <span className="status-tag tag-neutral">Forecasting</span>
                  </div>
                  <p className="simulator-intro">Estimate required grade points across remaining semester modules to reach your target.</p>
                  <div className="sim-controls">
                    <div className="input-inline">
                      <label htmlFor="simTargetInput">Target CGPA</label>
                      <input
                        id="simTargetInput"
                        type="number"
                        step="0.05"
                        min="5.0"
                        max="10.0"
                        value={simTarget}
                        onChange={(e) => setSimTarget(e.target.value)}
                      />
                    </div>
                    <button className="btn btn-secondary" onClick={handleCalculateTarget}>Calculate requirement</button>
                  </div>
                  <div className="sim-result-box">
                    {simMessage ? simMessage.text : "Enter target grade above to view credit requirement analysis."}
                  </div>
                </div>
              </div>

              {/* Courses Table */}
              <div className="card table-card">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: "140px" }}>Course code</th>
                      <th>Course title</th>
                      <th style={{ width: "90px", textAlign: "right" }}>Credits</th>
                      <th style={{ width: "90px", textAlign: "center" }}>Grade</th>
                      <th style={{ width: "110px", textAlign: "right" }}>Points</th>
                      <th style={{ width: "130px", textAlign: "right" }}>Weighted pts</th>
                      <th style={{ width: "80px", textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map(c => {
                      const pt = GRADE_POINTS[c.grade] ?? 0.0;
                      return (
                        <tr key={c.id}>
                          <td><span className="code-pill">{c.code}</span></td>
                          <td>{c.name}</td>
                          <td style={{ textAlign: "right" }}>{c.credits.toFixed(1)}</td>
                          <td style={{ textAlign: "center" }}><span className="status-tag tag-neutral">{c.grade}</span></td>
                          <td style={{ textAlign: "right" }}>{pt.toFixed(1)}</td>
                          <td style={{ textAlign: "right" }}><strong>{(c.credits * pt).toFixed(1)}</strong></td>
                          <td style={{ textAlign: "right" }}>
                            <button className="btn btn-sm btn-ghost" onClick={() => handleDeleteCourse(c.id)}>Remove</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ==================== TAB 3: FOCUS TIMER ==================== */}
          {activeTab === "pomodoro" && (
            <section className="tab-pane active">
              <div className="section-header">
                <div>
                  <h1 className="section-title">Focus timer</h1>
                  <p className="section-desc">Structured 25-minute study intervals to sustain deliberate attention.</p>
                </div>
              </div>

              <div className="pomodoro-grid">
                <div className="card timer-card">
                  <div className="mode-selector">
                    <button className={`mode-btn ${timerMode === "focus" ? "active" : ""}`} onClick={() => setPomoMode("focus", 25)}>Focus (25m)</button>
                    <button className={`mode-btn ${timerMode === "shortBreak" ? "active" : ""}`} onClick={() => setPomoMode("shortBreak", 5)}>Short break (5m)</button>
                    <button className={`mode-btn ${timerMode === "longBreak" ? "active" : ""}`} onClick={() => setPomoMode("longBreak", 15)}>Long break (15m)</button>
                  </div>

                  <div className="dial-container">
                    <svg className="dial-svg" width="240" height="240" viewBox="0 0 240 240">
                      <circle className="dial-track" cx="120" cy="120" r="104" />
                      <circle
                        className="dial-indicator"
                        cx="120"
                        cy="120"
                        r="104"
                        style={{ strokeDashoffset: ringOffset }}
                      />
                    </svg>
                    <div className="dial-center">
                      <span className="timer-readout">{formatTimerDigits()}</span>
                      <span className="timer-status-text">{timerMode === "focus" ? "Focus interval" : "Rest interval"}</span>
                    </div>
                  </div>

                  <div className="timer-action-row">
                    {!isTimerRunning ? (
                      <button className="btn btn-primary btn-md" onClick={() => setIsTimerRunning(true)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        <span>Start</span>
                      </button>
                    ) : (
                      <button className="btn btn-secondary btn-md" onClick={() => setIsTimerRunning(false)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                        <span>Pause</span>
                      </button>
                    )}
                    <button className="btn btn-secondary btn-md" onClick={() => { setIsTimerRunning(false); setTimerSeconds(initialMinutes * 60); }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                      <span>Reset</span>
                    </button>
                  </div>

                  <div className="timer-meta-strip">
                    <div className="meta-stat">
                      <span className="meta-num">{pomodoroStats.completedSessions}</span>
                      <span className="meta-lbl">Completed blocks</span>
                    </div>
                    <div className="meta-stat-divider"></div>
                    <div className="meta-stat">
                      <span className="meta-num">{pomodoroStats.totalMinutes}m</span>
                      <span className="meta-lbl">Total focus</span>
                    </div>
                    <div className="meta-stat-divider"></div>
                    <div className="meta-stat">
                      <span className="meta-num">{pomodoroStats.streakDays}</span>
                      <span className="meta-lbl">Session streak</span>
                    </div>
                  </div>
                </div>

                <div className="timer-side-column">
                  <div className="card">
                    <h2 className="card-title">Study session protocol</h2>
                    <ul className="guideline-list">
                      <li>
                        <span className="step-num">1</span>
                        <div>
                          <strong>Select one deliverable</strong>
                          <p>Silence notifications and work only on the selected subject.</p>
                        </div>
                      </li>
                      <li>
                        <span className="step-num">2</span>
                        <div>
                          <strong>Maintain continuous focus</strong>
                          <p>Avoid tab switching or passive browsing until the timer ends.</p>
                        </div>
                      </li>
                      <li>
                        <span className="step-num">3</span>
                        <div>
                          <strong>Take deliberate rest</strong>
                          <p>Step away from the screen for five minutes to recover attention.</p>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="card">
                    <h2 className="card-title">Active course focus</h2>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="pomoSubjectSelector">Log session under course</label>
                      <select
                        id="pomoSubjectSelector"
                        className="form-select"
                        value={selectedPomoCourse}
                        onChange={(e) => setSelectedPomoCourse(e.target.value)}
                      >
                        {courses.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ==================== TAB 4: FLASHCARDS ==================== */}
          {activeTab === "flashcards" && (
            <section className="tab-pane active">
              <div className="section-header">
                <div>
                  <h1 className="section-title">Revision flashcards</h1>
                  <p className="section-desc">Active recall practice to strengthen concept retrieval before examinations.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setModalFcOpen(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <span>New card</span>
                </button>
              </div>

              <div className="flashcard-deck-layout">
                {currentCard ? (
                  <div className="flashcard-viewport" onClick={() => setIsFlipped(prev => !prev)}>
                    <div className={`flashcard-box ${isFlipped ? "flipped" : ""}`}>
                      <div className="card-side side-front">
                        <div className="side-header">
                          <span className="tag-category">{currentCard.subject}</span>
                          <span className="side-counter">Card {currentFcIndex + 1} of {flashcards.length}</span>
                        </div>
                        <div className="side-content">
                          <span className="content-eyebrow">Prompt</span>
                          <p className="content-text">{currentCard.question}</p>
                        </div>
                        <div className="side-footer">
                          <span>Press <kbd className="keycap">Space</kbd> or click to reveal answer</span>
                        </div>
                      </div>

                      <div className="card-side side-back">
                        <div className="side-header">
                          <span className="tag-category">Answer explanation</span>
                          <span className="mastery-indicator">{currentCard.mastered ? "Mastered" : "Unmastered"}</span>
                        </div>
                        <div className="side-content">
                          <span className="content-eyebrow">Answer</span>
                          <p className="content-text">{currentCard.answer}</p>
                        </div>
                        <div className="side-footer">
                          <span>Click to flip back to question</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="card" style={{ padding: "40px", textAlign: "center" }}>
                    <p>No revision cards available. Create one to begin active recall.</p>
                  </div>
                )}

                <div className="flashcard-nav-row">
                  <button className="btn btn-secondary" onClick={() => { setIsFlipped(false); setCurrentFcIndex(prev => (prev - 1 + flashcards.length) % flashcards.length); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="15 18 9 12 15 6"/></svg>
                    <span>Previous</span>
                  </button>
                  <button className="btn btn-secondary" onClick={() => setIsFlipped(prev => !prev)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
                    <span>Flip card</span>
                  </button>
                  <button className="btn btn-secondary" onClick={handleToggleMastered}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <span>{currentCard?.mastered ? "Mastered" : "Mark mastered"}</span>
                  </button>
                  <button className="btn btn-secondary" onClick={() => { setIsFlipped(false); setCurrentFcIndex(prev => (prev + 1) % flashcards.length); }}>
                    <span>Next</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ==================== TAB 5: ANALYTICS ==================== */}
          {activeTab === "analytics" && (
            <section className="tab-pane active">
              <div className="section-header">
                <div>
                  <h1 className="section-title">Academic report and export</h1>
                  <p className="section-desc">Generate official performance documentation or download local state backups.</p>
                </div>
                <div className="section-actions">
                  <button className="btn btn-secondary" onClick={downloadTextReport}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span>Download text report</span>
                  </button>
                  <button className="btn btn-primary" onClick={downloadJsonBackup}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    <span>Download JSON backup</span>
                  </button>
                </div>
              </div>

              <div className="analytics-stat-row">
                <div className="card stat-card">
                  <span className="stat-caption">Registered courses</span>
                  <span className="stat-metric-large">{courses.length}</span>
                </div>
                <div className="card stat-card">
                  <span className="stat-caption">Logged assignments</span>
                  <span className="stat-metric-large">{tasks.length}</span>
                </div>
                <div className="card stat-card">
                  <span className="stat-caption">Mastered concepts</span>
                  <span className="stat-metric-large">{flashcards.filter(f => f.mastered).length} / {flashcards.length}</span>
                </div>
                <div className="card stat-card">
                  <span className="stat-caption">Total focus logged</span>
                  <span className="stat-metric-large">{pomodoroStats.totalMinutes}m</span>
                </div>
              </div>

              <div className="card report-box">
                <div className="report-box-header">
                  <span className="card-title">Generated summary preview</span>
                  <span className="status-tag tag-neutral">SQLite Database Engine</span>
                </div>
                <pre className="ascii-preview">
{`================================================================================
                    STUDENT WORKSPACE • ACADEMIC REPORT
================================================================================
Workspace:        Student Workspace
Current SGPA:     ${sgpa.toFixed(2)} / 10.00
Enrolled Credits: ${totalCredits.toFixed(1)} Credits
Study Time:       ${pomodoroStats.totalMinutes} minutes (${pomodoroStats.completedSessions} focus blocks)
Database:         Embedded SQLite WebAssembly Engine
================================================================================`}
                </pre>
              </div>
            </section>
          )}

        </main>
      </div>

      {/* Modal 1: Assignment */}
      {modalTaskOpen && (
        <div className="modal-backdrop active">
          <div className="modal-dialog">
            <div className="modal-header">
              <h2 className="modal-title">New assignment</h2>
              <button className="btn-close" onClick={() => setModalTaskOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Assignment title</label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Multithreaded Producer-Consumer Concurrency"
                />
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Course or module</label>
                  <input
                    type="text"
                    required
                    value={newTask.course}
                    onChange={(e) => setNewTask({ ...newTask, course: e.target.value })}
                    placeholder="Object Oriented Programming"
                  />
                </div>
                <div className="form-group">
                  <label>Due date</label>
                  <input
                    type="date"
                    required
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Estimated hours</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newTask.hours}
                    onChange={(e) => setNewTask({ ...newTask, hours: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModalTaskOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Course */}
      {modalCourseOpen && (
        <div className="modal-backdrop active">
          <div className="modal-dialog">
            <div className="modal-header">
              <h2 className="modal-title">Add semester course</h2>
              <button className="btn-close" onClick={() => setModalCourseOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateCourse}>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Course code</label>
                  <input
                    type="text"
                    required
                    value={newCourse.code}
                    onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                    placeholder="25CSH-208"
                  />
                </div>
                <div className="form-group">
                  <label>Course title</label>
                  <input
                    type="text"
                    required
                    value={newCourse.name}
                    onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                    placeholder="Object Oriented Programming"
                  />
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Credits</label>
                  <select
                    value={newCourse.credits}
                    onChange={(e) => setNewCourse({ ...newCourse, credits: e.target.value })}
                  >
                    <option value="1.0">1.0</option>
                    <option value="2.0">2.0</option>
                    <option value="3.0">3.0</option>
                    <option value="3.5">3.5</option>
                    <option value="4.0">4.0</option>
                    <option value="5.0">5.0</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Expected grade</label>
                  <select
                    value={newCourse.grade}
                    onChange={(e) => setNewCourse({ ...newCourse, grade: e.target.value })}
                  >
                    <option value="A+">A+ (10.0)</option>
                    <option value="A">A (9.0)</option>
                    <option value="B+">B+ (8.0)</option>
                    <option value="B">B (7.0)</option>
                    <option value="C+">C+ (6.0)</option>
                    <option value="C">C (5.0)</option>
                    <option value="D">D (4.0)</option>
                    <option value="F">F (0.0)</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModalCourseOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Flashcard */}
      {modalFcOpen && (
        <div className="modal-backdrop active">
          <div className="modal-dialog">
            <div className="modal-header">
              <h2 className="modal-title">Create revision card</h2>
              <button className="btn-close" onClick={() => setModalFcOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateFlashcard}>
              <div className="form-group">
                <label>Topic</label>
                <input
                  type="text"
                  required
                  value={newFc.subject}
                  onChange={(e) => setNewFc({ ...newFc, subject: e.target.value })}
                  placeholder="Java OOP • Polymorphism"
                />
              </div>
              <div className="form-group">
                <label>Question prompt</label>
                <textarea
                  rows="3"
                  required
                  value={newFc.question}
                  onChange={(e) => setNewFc({ ...newFc, question: e.target.value })}
                  placeholder="Enter concept prompt..."
                />
              </div>
              <div className="form-group">
                <label>Answer</label>
                <textarea
                  rows="4"
                  required
                  value={newFc.answer}
                  onChange={(e) => setNewFc({ ...newFc, answer: e.target.value })}
                  placeholder="Enter concise explanation..."
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModalFcOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save card</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// Server-side rendering fetches initial data directly from SQLite!
export async function getServerSideProps() {
  try {
    const db = await getDb();
    const coursesRows = db.query("SELECT * FROM courses ORDER BY created_at ASC");
    const tasksRows = db.query("SELECT * FROM tasks ORDER BY created_at DESC");
    const flashcardsRows = db.query("SELECT * FROM flashcards ORDER BY created_at ASC");
    const pomoRows = db.query("SELECT COUNT(*) as count, COALESCE(SUM(duration_minutes), 0) as total_minutes FROM pomodoro_sessions");

    return {
      props: {
        initialData: {
          courses: coursesRows.map(r => ({
            id: r.id,
            code: r.code,
            name: r.name,
            credits: Number(r.credits),
            grade: r.grade,
            gradePoint: Number(r.grade_point)
          })),
          tasks: tasksRows.map(r => ({
            id: r.id,
            title: r.title,
            course: r.course,
            dueDate: r.due_date,
            priority: r.priority,
            hours: Number(r.hours),
            completed: Boolean(r.completed)
          })),
          flashcards: flashcardsRows.map(r => ({
            id: r.id,
            subject: r.subject,
            question: r.question,
            answer: r.answer,
            mastered: Boolean(r.mastered)
          })),
          pomodoro: {
            completedSessions: Number(pomoRows[0]?.count || 0),
            totalMinutes: Number(pomoRows[0]?.total_minutes || 0),
            streakDays: 0
          }
        }
      }
    };
  } catch (e) {
    console.error("getServerSideProps database error:", e);
    return {
      props: {
        initialData: {
          courses: [],
          tasks: [],
          flashcards: [],
          pomodoro: { completedSessions: 0, totalMinutes: 0, streakDays: 0 }
        }
      }
    };
  }
}
