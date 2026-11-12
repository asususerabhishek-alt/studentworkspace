package campusflow.service;

import campusflow.model.AppData;
import campusflow.model.AssignmentTask;
import campusflow.model.CourseGrade;

import java.io.*;

/**
 * Storage and Export Service demonstrating Syllabus Unit 2:
 * - IO Package & Streams
 * - Object Serialization & Deserialization
 * - File and File Streams (FileInputStream, FileOutputStream)
 * - Text File Report Generation (PrintWriter, BufferedWriter, FileWriter)
 */
public class StorageService {

    private static final String DEFAULT_FILE_NAME = "campusflow_data.ser";

    /**
     * Serializes the application data into a binary file.
     */
    public static void save(AppData data, File targetFile) throws IOException {
        if (targetFile == null) {
            targetFile = new File(DEFAULT_FILE_NAME);
        }
        try (FileOutputStream fos = new FileOutputStream(targetFile);
             BufferedOutputStream bos = new BufferedOutputStream(fos);
             ObjectOutputStream oos = new ObjectOutputStream(bos)) {
            oos.writeObject(data);
            oos.flush();
        }
    }

    /**
     * Deserializes the application data from a binary file.
     */
    public static AppData load(File sourceFile) throws IOException, ClassNotFoundException {
        if (sourceFile == null || !sourceFile.exists()) {
            return null;
        }
        try (FileInputStream fis = new FileInputStream(sourceFile);
             BufferedInputStream bis = new BufferedInputStream(fis);
             ObjectInputStream ois = new ObjectInputStream(bis)) {
            return (AppData) ois.readObject();
        }
    }

    /**
     * Generates a human-readable Academic Performance & Task Summary Report (.txt).
     * Demonstrates Character Stream I/O with PrintWriter & BufferedWriter.
     */
    public static void exportReport(AppData data, File exportFile, double sgpa) throws IOException {
        try (PrintWriter writer = new PrintWriter(new BufferedWriter(new FileWriter(exportFile)))) {
            writer.println("===============================================================");
            writer.println("           CAMPUSFLOW ACADEMIC PROGRESS & STUDY REPORT         ");
            writer.println("===============================================================");
            writer.println("Student Name:    " + data.getStudentName());
            writer.println("Enrollment No:   " + data.getStudentRoll());
            writer.println("Department:      " + data.getProgramName());
            writer.println("Current SGPA:    " + String.format("%.2f", sgpa) + " / 10.00");
            writer.println("Focus Sessions:  " + data.getCompletedPomodoros() + " Pomodoros completed");
            writer.println("===============================================================\n");

            writer.println("1. REGISTERED COURSES & PERFORMANCE:");
            writer.println("---------------------------------------------------------------");
            writer.printf("%-12s %-30s %-8s %-6s\n", "Code", "Course Name", "Credits", "Grade");
            writer.println("---------------------------------------------------------------");
            for (CourseGrade c : data.getCourses()) {
                writer.printf("%-12s %-30s %-8.1f %-6s\n", 
                    c.getCourseCode(), c.getCourseName(), c.getCredits(), c.getLetterGrade());
            }
            writer.println("---------------------------------------------------------------\n");

            writer.println("2. ASSIGNMENTS & DEADLINES:");
            writer.println("---------------------------------------------------------------");
            writer.printf("%-20s %-15s %-12s %-10s %-10s\n", "Title", "Subject", "Due Date", "Priority", "Status");
            writer.println("---------------------------------------------------------------");
            for (AssignmentTask a : data.getAssignments()) {
                writer.printf("%-20s %-15s %-12s %-10s %-10s\n",
                    a.getTitle(), a.getSubject(), a.getDueDate(), a.getPriority(), 
                    (a.isCompleted() ? "DONE" : "PENDING"));
            }
            writer.println("---------------------------------------------------------------\n");

            writer.println("3. REVISION FLASHCARDS SUMMARY:");
            writer.println("Total Flashcards Created: " + data.getFlashcards().size());
            long mastered = data.getFlashcards().stream().filter(f -> f.isMastered()).count();
            writer.println("Mastered Topics:         " + mastered);
            writer.println("\nGenerated automatically via CampusFlow Academic Suite.");
            writer.println("Technology: Pure Java Standard Edition (No external DB needed)");
            writer.println("===============================================================");
        }
    }
}
