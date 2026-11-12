import { getDb } from "../../lib/db";

export default async function handler(req, res) {
  try {
    const db = await getDb();

    if (req.method === "POST") {
      const { title, course, dueDate, priority, hours } = req.body;
      if (!title || !course || !dueDate) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const id = "T-" + Date.now();
      const now = Date.now();

      db.run(
        "INSERT INTO tasks (id, title, course, due_date, priority, hours, completed, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)",
        [id, title, course, dueDate, priority || "Medium", Number(hours) || 3, now]
      );

      return res.status(201).json({ success: true, id });
    }

    if (req.method === "PATCH") {
      const { id, completed } = req.body;
      if (!id) return res.status(400).json({ error: "Task id is required" });

      db.run("UPDATE tasks SET completed = ? WHERE id = ?", [completed ? 1 : 0, id]);
      return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "Task id is required" });

      db.run("DELETE FROM tasks WHERE id = ?", [id]);
      return res.status(200).json({ success: true });
    }

    res.setHeader("Allow", ["POST", "PATCH", "DELETE"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error("API /api/tasks error:", err);
    return res.status(500).json({ error: err.message });
  }
}
