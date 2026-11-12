package campusflow.model;

import java.io.Serializable;

/**
 * Abstract base class demonstrating OOP principles: Abstraction, Encapsulation, and Polymorphism.
 * Represents an academic item with due date and priority tracking.
 * Part of Syllabus Unit 1 (Classes, Objects, Inheritance, Abstract classes).
 */
public abstract class AcademicItem implements Serializable, Comparable<AcademicItem> {
    private static final long serialVersionUID = 1L;

    protected String id;
    protected String title;
    protected String subject;
    protected String dueDate; // Format: YYYY-MM-DD
    protected String priority; // High, Medium, Low
    protected boolean completed;

    public AcademicItem(String id, String title, String subject, String dueDate, String priority) {
        this.id = id;
        this.title = title;
        this.subject = subject;
        this.dueDate = dueDate;
        this.priority = priority;
        this.completed = false;
    }

    // Abstract methods demonstrating Polymorphism
    public abstract String getItemType();
    public abstract String getUrgencyStatus();

    // Getters and Setters (Encapsulation)
    public String getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }

    @Override
    public int compareTo(AcademicItem other) {
        // Sort priority: High -> Medium -> Low, then by date
        int p1 = priorityRank(this.priority);
        int p2 = priorityRank(other.priority);
        if (p1 != p2) return Integer.compare(p1, p2);
        return this.dueDate.compareTo(other.dueDate);
    }

    private int priorityRank(String p) {
        if ("High".equalsIgnoreCase(p)) return 1;
        if ("Medium".equalsIgnoreCase(p)) return 2;
        return 3;
    }

    @Override
    public String toString() {
        return "[" + getItemType() + "] " + title + " (" + subject + ") - Due: " + dueDate;
    }
}
