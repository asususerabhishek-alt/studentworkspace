import { getDb } from "../../lib/db";

export default async function handler(req, res) {
  try {
    const db = await getDb();

    if (req.method === "POST") {
      const { subject, durationMinutes } = req.body;
      const id = "PS-" + Date.now();
      const now = Date.now();

      db.run(
        "INSERT INTO pomodoro_sessions (id, subject, duration_minutes, completed_at) VALUES (?, ?, ?, ?)",
        [id, subject || "General Study", Number(durationMinutes) || 25, now]
      );

      return res.status(201).json({ success: true, id });
    }

    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error("API /api/pomodoro error:", err);
    return res.status(500).json({ error: err.message });
  }
}
