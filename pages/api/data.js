import { getDb } from "../../lib/db";

export default async function handler(req, res) {
  try {
    const db = await getDb();

    if (req.method === "GET") {
      const coursesRows = db.query("SELECT * FROM courses ORDER BY created_at ASC");
      const tasksRows = db.query("SELECT * FROM tasks ORDER BY created_at DESC");
      const flashcardsRows = db.query("SELECT * FROM flashcards ORDER BY created_at ASC");
      const pomoRows = db.query("SELECT COUNT(*) as count, COALESCE(SUM(duration_minutes), 0) as total_minutes FROM pomodoro_sessions");

      const courses = coursesRows.map(r => ({
        id: r.id,
        code: r.code,
        name: r.name,
        credits: Number(r.credits),
        grade: r.grade,
        gradePoint: Number(r.grade_point)
      }));

      const tasks = tasksRows.map(r => ({
        id: r.id,
        title: r.title,
        course: r.course,
        dueDate: r.due_date,
        priority: r.priority,
        hours: Number(r.hours),
        completed: Boolean(r.completed)
      }));

      const flashcards = flashcardsRows.map(r => ({
        id: r.id,
        subject: r.subject,
        question: r.question,
        answer: r.answer,
        mastered: Boolean(r.mastered)
      }));

      const pomoCount = Number(pomoRows[0]?.count || 0);
      const pomoMinutes = Number(pomoRows[0]?.total_minutes || 0);

      return res.status(200).json({
        student: {
          name: "Student Workspace",
          role: "Academic Workspace",
          department: "Computer Science & Engineering"
        },
        courses,
        tasks,
        flashcards,
        pomodoro: {
          completedSessions: pomoCount,
          totalMinutes: pomoMinutes,
          streakDays: pomoCount > 0 ? 4 : 0
        }
      });
    }

    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error("API /api/data error:", err);
    return res.status(500).json({ error: "Database error: " + err.message });
  }
}
