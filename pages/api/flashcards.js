import { getDb } from "../../lib/db";

export default async function handler(req, res) {
  try {
    const db = await getDb();

    if (req.method === "POST") {
      const { subject, question, answer } = req.body;
      if (!subject || !question || !answer) {
        return res.status(400).json({ error: "Missing required flashcard fields" });
      }

      const id = "FC-" + Date.now();
      const now = Date.now();

      db.run(
        "INSERT INTO flashcards (id, subject, question, answer, mastered, created_at) VALUES (?, ?, ?, ?, 0, ?)",
        [id, subject, question, answer, now]
      );

      return res.status(201).json({ success: true, id });
    }

    if (req.method === "PATCH") {
      const { id, mastered } = req.body;
      if (!id) return res.status(400).json({ error: "Flashcard id is required" });

      db.run("UPDATE flashcards SET mastered = ? WHERE id = ?", [mastered ? 1 : 0, id]);

      return res.status(200).json({ success: true });
    }

    res.setHeader("Allow", ["POST", "PATCH"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error("API /api/flashcards error:", err);
    return res.status(500).json({ error: err.message });
  }
}
