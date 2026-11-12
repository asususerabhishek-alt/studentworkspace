const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function captureScreenshots() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  // Using clean standard 1200 x 850 viewport with 2x retina scaling
  await page.setViewport({ width: 1200, height: 850, deviceScaleFactor: 2 });

  console.log('Navigating to live application...');
  await page.goto('https://asususerabhishek-alt.github.io/studentworkspace/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  console.log('Seeding SQLite with exact schema and rich data...');
  await page.evaluate(async () => {
    const SQL = await window.initSqlJs({
      locateFile: file => 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/' + file
    });
    const db = new SQL.Database();
    db.run(`
      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY, code TEXT NOT NULL, name TEXT NOT NULL, credits REAL NOT NULL, grade TEXT NOT NULL, grade_point REAL NOT NULL, created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, course TEXT NOT NULL, due_date TEXT NOT NULL, priority TEXT NOT NULL, hours INTEGER NOT NULL, completed INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS flashcards (
        id TEXT PRIMARY KEY, subject TEXT NOT NULL, question TEXT NOT NULL, answer TEXT NOT NULL, mastered INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS pomodoro_sessions (
        id TEXT PRIMARY KEY, subject TEXT NOT NULL, duration_minutes INTEGER NOT NULL, completed_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS custom_subjects (
        name TEXT PRIMARY KEY, created_at INTEGER NOT NULL
      );
    `);

    const now = Date.now();
    db.run(`
      INSERT INTO courses VALUES
      ('C1', 'CS201', 'Object Oriented Programming (Java)', 4.0, 'A+', 10.0, ${now - 50000}),
      ('C2', 'CS202', 'Data Structures & Algorithms', 4.0, 'A', 9.0, ${now - 40000}),
      ('C3', 'CS203', 'Database Management Systems', 4.0, 'A+', 10.0, ${now - 30000}),
      ('C4', 'CS204', 'Operating Systems Concepts', 3.0, 'B+', 8.0, ${now - 20000}),
      ('C5', 'CS205', 'Computer Networks & Protocols', 3.0, 'A', 9.0, ${now - 10000});

      INSERT INTO tasks VALUES
      ('T1', 'OOP Lab 4: Polymorphism & Custom Interfaces', 'Object Oriented Programming (Java)', '2026-11-15', 'HIGH', 4, 0, ${now - 50000}),
      ('T2', 'DBMS Relational Schema Normalization (BCNF)', 'Database Management Systems', '2026-11-18', 'HIGH', 5, 0, ${now - 40000}),
      ('T3', 'Operating Systems Mutex Lock Synchronization', 'Operating Systems Concepts', '2026-11-21', 'MEDIUM', 3, 0, ${now - 30000}),
      ('T4', 'Balanced AVL & Red-Black Tree Implementation', 'Data Structures & Algorithms', '2026-11-25', 'MEDIUM', 4, 0, ${now - 20000}),
      ('T5', 'Socket Programming Client-Server Architecture', 'Computer Networks & Protocols', '2026-11-12', 'LOW', 2, 1, ${now - 10000});

      INSERT INTO pomodoro_sessions VALUES
      ('P1', 'Object Oriented Programming (Java)', 30, ${now - 86400000 * 2}),
      ('P2', 'Object Oriented Programming (Java)', 30, ${now - 86400000}),
      ('P3', 'Data Structures & Algorithms', 45, ${now - 40000000}),
      ('P4', 'Database Management Systems', 25, ${now - 20000000});

      INSERT INTO flashcards VALUES
      ('F1', 'Object Oriented Programming (Java)', 'What are the 4 core pillars of Object-Oriented Programming in Java?', 'Encapsulation, Abstraction, Inheritance, and Polymorphism. They promote modularity, clean interface contracts, and code reusability.', 1, ${now - 30000}),
      ('F2', 'Object Oriented Programming (Java)', 'Explain the difference between Overloading and Overriding.', 'Overloading is compile-time polymorphism (same method name, different parameter signature in same class). Overriding is runtime polymorphism (subclass overrides superclass method with exact signature).', 1, ${now - 20000}),
      ('F3', 'Database Management Systems', 'What does ACID stand for in relational transactions?', 'Atomicity, Consistency, Isolation, and Durability. These properties guarantee reliable database operations even through hardware faults.', 0, ${now - 10000});

      INSERT INTO custom_subjects VALUES
      ('Object Oriented Programming (Java)', ${now - 50000}),
      ('Data Structures & Algorithms', ${now - 40000}),
      ('Database Management Systems', ${now - 30000}),
      ('Operating Systems Concepts', ${now - 20000}),
      ('Computer Networks & Protocols', ${now - 10000});
    `);

    const data = db.export();
    localStorage.setItem('student_workspace_sqlite_binary', JSON.stringify(Array.from(data)));
  });

  console.log('Reloading page with populated SQLite data...');
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  // Verify data is populated
  const counts = await page.evaluate(() => {
    return {
      tasks: document.querySelectorAll('#taskList .task-card').length,
      courses: document.querySelectorAll('#courseTableBody tr').length,
      sgpa: document.getElementById('dispSgpa') ? document.getElementById('dispSgpa').textContent : ''
    };
  });
  console.log('Populated data verified in DOM:', counts);

  // Hide the app header (.app-header) so screenshots crop out the app bar!
  await page.evaluate(() => {
    const appHeader = document.querySelector('.app-header');
    if (appHeader) appHeader.style.display = 'none';
    document.body.style.background = '#FBFBF9';
  });

  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Helper to capture a tab pane without clipping
  async function captureTab(tabId, filename, setupFn) {
    console.log(`Capturing ${filename}...`);
    await page.evaluate((tid) => {
      document.querySelector(`[data-tab="${tid}"]`).click();
    }, tabId);
    await new Promise(r => setTimeout(r, 500));

    if (setupFn) {
      await page.evaluate(setupFn);
      await new Promise(r => setTimeout(r, 500));
    }

    const tabEl = await page.$('.tab-pane.active');
    await tabEl.screenshot({
      path: path.join(screenshotsDir, filename)
    });
  }

  // 1. Assignments
  await captureTab('assignments', 'web_assignments.png');

  // 2. SGPA Calculator
  await captureTab('gpa', 'web_gpa.png');

  // 3. Focus Timer
  await captureTab('pomodoro', 'web_pomodoro.png', () => {
    const durInput = document.getElementById('customTimerMinutes');
    if (durInput) durInput.value = '30';
    const subSel = document.getElementById('pomoSubjectSelector');
    if (subSel && subSel.options.length > 0) subSel.selectedIndex = 0;
  });

  // 4. Revision Flashcards
  await captureTab('flashcards', 'web_flashcards.png');

  // 5. Summary & Export
  await captureTab('analytics', 'web_preview.png', () => {
    const genBtn = document.getElementById('btnGenerateReport');
    if (genBtn) genBtn.click();
  });

  console.log('All 5 high quality screenshots successfully captured and saved!');
  await browser.close();
}

captureScreenshots().catch(err => {
  console.error('Error in captureScreenshots:', err);
  process.exit(1);
});
