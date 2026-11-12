package campusflow.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * Encapsulates the entire application state for seamless serialization/deserialization.
 * Demonstrates Unit 2 Object Serialization without requiring any external database.
 */
public class AppData implements Serializable {
    private static final long serialVersionUID = 1L;

    private String studentName;
    private String studentRoll;
    private String programName;
    private List<AssignmentTask> assignments;
    private List<CourseGrade> courses;
    private List<Flashcard> flashcards;
    private int completedPomodoros;

    public AppData() {
        this.studentName = "Abhishek Kumar";
        this.studentRoll = "CS201-25CSH208";
        this.programName = "B.E. Computer Science & Engineering";
        this.assignments = new ArrayList<>();
        this.courses = new ArrayList<>();
        this.flashcards = new ArrayList<>();
        this.completedPomodoros = 0;
    }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }
    public String getStudentRoll() { return studentRoll; }
    public void setStudentRoll(String studentRoll) { this.studentRoll = studentRoll; }
    public String getProgramName() { return programName; }
    public void setProgramName(String programName) { this.programName = programName; }
    public List<AssignmentTask> getAssignments() { return assignments; }
    public List<CourseGrade> getCourses() { return courses; }
    public List<Flashcard> getFlashcards() { return flashcards; }
    public int getCompletedPomodoros() { return completedPomodoros; }
    public void setCompletedPomodoros(int completedPomodoros) { this.completedPomodoros = completedPomodoros; }
    public void incrementPomodoros() { this.completedPomodoros++; }
}
