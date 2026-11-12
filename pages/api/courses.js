import { getDb } from "../../lib/db";

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

export default async function handler(req, res) {
  try {
    const db = await getDb();

    if (req.method === "POST") {
      const { code, name, credits, grade } = req.body;
      if (!code || !name) {
        return res.status(400).json({ error: "Course code and title are required" });
      }

      const id = "C-" + Date.now();
      const gradePoint = GRADE_POINTS[grade] ?? 0.0;
      const now = Date.now();

      db.run(
        "INSERT INTO courses (id, code, name, credits, grade, grade_point, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [id, code, name, Number(credits) || 4.0, grade, gradePoint, now]
      );

      return res.status(201).json({ success: true, id });
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "Course id is required" });

      db.run("DELETE FROM courses WHERE id = ?", [id]);
      return res.status(200).json({ success: true });
    }

    res.setHeader("Allow", ["POST", "DELETE"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error("API /api/courses error:", err);
    return res.status(500).json({ error: err.message });
  }
}
