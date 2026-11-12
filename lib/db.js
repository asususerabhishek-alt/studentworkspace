import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";

let SQL = null;
let dbInstance = null;

// File persistence paths
const isVercel = !!process.env.VERCEL;
const dbDir = isVercel ? "/tmp" : path.join(process.cwd(), "data");

if (!fs.existsSync(dbDir)) {
  try {
    fs.mkdirSync(dbDir, { recursive: true });
  } catch (e) {}
}

const dbPath = path.join(dbDir, "student_suite.db");

function persistDb() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (err) {
    console.error("Failed to persist SQLite database to disk:", err);
  }
}

export async function getDb() {
  if (!SQL) {
    SQL = await initSqlJs();
  }

  if (!dbInstance) {
    // Check if seeded database file already exists
    if (fs.existsSync(dbPath)) {
      try {
        const buffer = fs.readFileSync(dbPath);
        dbInstance = new SQL.Database(buffer);
      } catch (e) {
        dbInstance = new SQL.Database();
      }
    } else {
      dbInstance = new SQL.Database();
    }

    initSchema(dbInstance);
  }

  return {
    query: (sql, params = []) => {
      const stmt = dbInstance.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return rows;
    },
    run: (sql, params = []) => {
      dbInstance.run(sql, params);
      persistDb();
    }
  };
}

function initSchema(db) {
  // 1. Courses Table
  db.run(`
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      credits REAL NOT NULL,
      grade TEXT NOT NULL,
      grade_point REAL NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  // 2. Tasks Table
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      course TEXT NOT NULL,
      due_date TEXT NOT NULL,
      priority TEXT NOT NULL,
      hours INTEGER NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `);

  // 3. Flashcards Table
  db.run(`
    CREATE TABLE IF NOT EXISTS flashcards (
      id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      mastered INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `);

  // 4. Pomodoro Sessions Table
  db.run(`
    CREATE TABLE IF NOT EXISTS pomodoro_sessions (
      id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      completed_at INTEGER NOT NULL
    )
  `);

  // Empty schema initialized without pre-seeding
  persistDb();
}
