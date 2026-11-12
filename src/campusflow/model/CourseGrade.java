package campusflow.model;

import java.io.Serializable;

/**
 * Model representing a college course, credit weighting, and letter grade.
 * Facilitates SGPA/CGPA computation according to University grading scale.
 */
public class CourseGrade implements Serializable {
    private static final long serialVersionUID = 1L;

    private String courseCode;
    private String courseName;
    private double credits;
    private String letterGrade; // A+, A, B+, B, C, D, F

    public CourseGrade(String courseCode, String courseName, double credits, String letterGrade) {
        this.courseCode = courseCode;
        this.courseName = courseName;
        this.credits = credits;
        this.letterGrade = letterGrade;
    }

    public double getGradePoint() {
        switch (letterGrade.toUpperCase()) {
            case "A+": return 10.0;
            case "A":  return 9.0;
            case "B+": return 8.0;
            case "B":  return 7.0;
            case "C+": return 6.0;
            case "C":  return 5.0;
            case "D":  return 4.0;
            default:   return 0.0; // F
        }
    }

    public double getWeightedPoints() {
        return credits * getGradePoint();
    }

    // Getters and Setters
    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }
    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }
    public double getCredits() { return credits; }
    public void setCredits(double credits) { this.credits = credits; }
    public String getLetterGrade() { return letterGrade; }
    public void setLetterGrade(String letterGrade) { this.letterGrade = letterGrade; }

    @Override
    public String toString() {
        return courseCode + ": " + courseName + " (" + credits + " cr) - " + letterGrade;
    }
}
