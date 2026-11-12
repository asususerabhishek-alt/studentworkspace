package campusflow.model;

/**
 * Concrete subclass extending AcademicItem (Inheritance & Overriding).
 * Represents student homework, lab submissions, and term papers.
 */
public class AssignmentTask extends AcademicItem {
    private static final long serialVersionUID = 1L;

    private int estimatedHours;
    private String notes;

    public AssignmentTask(String id, String title, String subject, String dueDate, String priority, int estimatedHours, String notes) {
        super(id, title, subject, dueDate, priority);
        this.estimatedHours = estimatedHours;
        this.notes = notes;
    }

    // Overloaded Constructor (Polymorphism: Overloading)
    public AssignmentTask(String id, String title, String subject, String dueDate, String priority) {
        this(id, title, subject, dueDate, priority, 2, "General Assignment");
    }

    @Override
    public String getItemType() {
        return "Assignment";
    }

    @Override
    public String getUrgencyStatus() {
        if (completed) return "Completed";
        if ("High".equalsIgnoreCase(priority)) return "Urgent Attention";
        if ("Medium".equalsIgnoreCase(priority)) return "Upcoming";
        return "Flexible";
    }

    public int getEstimatedHours() { return estimatedHours; }
    public void setEstimatedHours(int estimatedHours) { this.estimatedHours = estimatedHours; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
