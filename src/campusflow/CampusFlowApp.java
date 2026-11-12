package campusflow;

import campusflow.model.AppData;
import campusflow.model.AssignmentTask;
import campusflow.model.CourseGrade;
import campusflow.model.Flashcard;
import campusflow.service.StorageService;
import campusflow.ui.CampusFlowGUI;

import javax.imageio.ImageIO;
import javax.swing.*;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;

/**
 * Main Application Launcher for CampusFlow Academic Productivity Suite.
 * Designed for Bachelor of Engineering (Computer Science & Engineering) students.
 * Student Name: Abhishek Kumar (Roll: CS201-25CSH208)
 */
public class CampusFlowApp {

    public static void main(String[] args) {
        // Set modern look and feel
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception ignored) {}

        // Check if screenshot mode requested
        if (args.length > 0 && "--screenshot".equalsIgnoreCase(args[0])) {
            captureApplicationScreenshots();
            return;
        }

        SwingUtilities.invokeLater(() -> {
            AppData data = loadOrCreateData();
            CampusFlowGUI frame = new CampusFlowGUI(data);
            frame.setVisible(true);
        });
    }

    /**
     * Initializes default rich academic data for Abhishek Kumar matching the syllabus.
     */
    public static AppData loadOrCreateData() {
        File dataFile = new File("campusflow_data.ser");
        if (dataFile.exists()) {
            try {
                AppData loaded = StorageService.load(dataFile);
                if (loaded != null) return loaded;
            } catch (Exception e) {
                System.out.println("Notice: Initializing fresh academic dataset.");
            }
        }

        AppData fresh = new AppData();
        fresh.setStudentName("Abhishek Kumar");
        fresh.setStudentRoll("CS201 - 25CSH208");
        fresh.setProgramName("B.E. Computer Science & Engineering (UIE)");
        fresh.setCompletedPomodoros(4);

        // Populate Courses based on actual syllabus subjects
        fresh.getCourses().add(new CourseGrade("25CSH-208", "Object Oriented Programming (Java)", 4.0, "A+"));
        fresh.getCourses().add(new CourseGrade("25CSH-202", "Data Structures & Algorithms", 4.0, "A"));
        fresh.getCourses().add(new CourseGrade("25CSH-205", "Computer Architecture & Organization", 3.0, "A+"));
        fresh.getCourses().add(new CourseGrade("25CSH-209", "Discrete Mathematical Structures", 3.5, "A"));
        fresh.getCourses().add(new CourseGrade("25CSH-212", "Operating Systems & Concurrency", 3.5, "B+"));

        // Populate Assignments matching syllabus experiments
        fresh.getAssignments().add(new AssignmentTask("T-1", "Java Multithreading Producer-Consumer", "OOP Java", "2026-11-18", "High", 4, "Sync & wait-notify lab"));
        fresh.getAssignments().add(new AssignmentTask("T-2", "HackerRank Serialization & IO Lab", "OOP Java", "2026-11-20", "High", 3, "Object stream serialization"));
        fresh.getAssignments().add(new AssignmentTask("T-3", "Binary Search Tree Traversal Analysis", "Data Structures", "2026-11-25", "Medium", 5, "In-order and post-order"));
        fresh.getAssignments().add(new AssignmentTask("T-4", "Assembly Instruction Pipeline Report", "Computer Org", "2026-11-28", "Low", 2, "Hazard mitigation study"));
        fresh.getAssignments().get(3).setCompleted(true); // Completed task demonstration

        // Populate Revision Flashcards matching Java OOP syllabus
        fresh.getFlashcards().add(new Flashcard("FC-1", "Java OOP - Polymorphism",
            "What is the difference between Method Overloading and Method Overriding?",
            "Overloading happens at compile-time within the same class (same method name, different parameter signature). Overriding happens at runtime when a subclass provides a specific implementation of a method already declared in its superclass using the exact same signature."));

        fresh.getFlashcards().add(new Flashcard("FC-2", "Java I/O - Serialization",
            "What is Object Serialization in Java and how is it achieved?",
            "Object Serialization converts a Java object state into a byte stream via ObjectOutputStream to store it in a file or transmit over a network. The class must implement java.io.Serializable (a marker interface)."));

        fresh.getFlashcards().add(new Flashcard("FC-3", "Java Multithreading - Synchronization",
            "Why is the 'synchronized' keyword needed in multithreaded applications?",
            "It controls concurrent access of multiple threads to shared resources, preventing race conditions and thread interference by acquiring an intrinsic object monitor lock."));

        // Save fresh initial data
        try {
            StorageService.save(fresh, dataFile);
        } catch (Exception ignored) {}

        return fresh;
    }

    /**
     * Programmatic screenshot generation to produce authentic screenshots of all tabs.
     */
    public static void captureApplicationScreenshots() {
        System.out.println("Starting rendering of CampusFlow application screenshots...");
        AppData data = loadOrCreateData();
        CampusFlowGUI frame = new CampusFlowGUI(data);
        frame.setSize(1020, 700);
        frame.addNotify();
        frame.validate();
        frame.doLayout();

        File dir = new File("screenshots");
        if (!dir.exists()) dir.mkdirs();

        try {
            // Render Tab 0: Assignments
            frame.getTabbedPane().setSelectedIndex(0);
            frame.validate();
            renderAndSave(frame, new File("screenshots/screenshot_tab1_assignments.png"));

            // Render Tab 1: GPA Calculator
            frame.getTabbedPane().setSelectedIndex(1);
            frame.validate();
            renderAndSave(frame, new File("screenshots/screenshot_tab2_gpa.png"));

            // Render Tab 2: Pomodoro Timer
            frame.getTabbedPane().setSelectedIndex(2);
            frame.validate();
            renderAndSave(frame, new File("screenshots/screenshot_tab3_pomodoro.png"));

            // Render Tab 3: Flashcards
            frame.getTabbedPane().setSelectedIndex(3);
            frame.validate();
            renderAndSave(frame, new File("screenshots/screenshot_tab4_flashcards.png"));

            // Render Full Overview
            frame.getTabbedPane().setSelectedIndex(0);
            frame.validate();
            renderAndSave(frame, new File("screenshots/screenshot_overview.png"));

            System.out.println("All 5 screenshots successfully captured in ./screenshots/");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static void renderAndSave(JFrame frame, File file) throws Exception {
        BufferedImage img = new BufferedImage(frame.getWidth(), frame.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D g2 = img.createGraphics();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        frame.getContentPane().printAll(g2);
        g2.dispose();
        ImageIO.write(img, "png", file);
        System.out.println("Saved screenshot: " + file.getAbsolutePath() + " (" + file.length() + " bytes)");
    }
}
