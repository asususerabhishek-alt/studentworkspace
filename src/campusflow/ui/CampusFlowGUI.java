package campusflow.ui;

import campusflow.model.*;
import campusflow.service.FocusTimerService;
import campusflow.service.InvalidDataException;
import campusflow.service.StorageService;

import javax.imageio.ImageIO;
import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.border.LineBorder;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.DefaultTableModel;
import javax.swing.table.JTableHeader;
import java.awt.*;
import java.awt.event.ActionListener;
import java.awt.image.BufferedImage;
import java.io.File;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

/**
 * Modern Swing User Interface for CampusFlow Academic Productivity Suite.
 * Styled with elegant pastel tones, clean card panels, and responsive layout.
 * Meets Syllabus practical requirements (Swing functionalities, Event handling,
 * Thread synchronization, and I/O integration).
 */
public class CampusFlowGUI extends JFrame {

    // Pastel Theme Colors
    public static final Color BG_LIGHT = new Color(248, 249, 253);
    public static final Color CARD_BG = Color.WHITE;
    public static final Color PASTEL_PURPLE_BG = new java.awt.Color(238, 240, 255);
    public static final Color PASTEL_PURPLE_TEXT = new java.awt.Color(79, 70, 229);
    public static final Color PASTEL_MINT_BG = new java.awt.Color(230, 249, 238);
    public static final Color PASTEL_MINT_TEXT = new java.awt.Color(16, 149, 93);
    public static final Color PASTEL_CORAL_BG = new java.awt.Color(254, 238, 238);
    public static final Color PASTEL_CORAL_TEXT = new java.awt.Color(220, 38, 38);
    public static final Color PASTEL_AMBER_BG = new java.awt.Color(254, 246, 230);
    public static final Color PASTEL_AMBER_TEXT = new java.awt.Color(180, 83, 9);
    public static final Color PASTEL_BLUE_BG = new java.awt.Color(234, 245, 255);
    public static final Color PASTEL_BLUE_TEXT = new java.awt.Color(2, 132, 199);
    public static final Color TEXT_DARK = new java.awt.Color(30, 41, 59);
    public static final Color TEXT_MUTED = new java.awt.Color(100, 116, 139);
    public static final Color BORDER_COLOR = new java.awt.Color(226, 232, 240);

    private AppData data;
    private JTabbedPane tabbedPane;

    // Header & Summary Labels
    private JLabel lblSgpaBadge;
    private JLabel lblPendingBadge;
    private JLabel lblPomodoroBadge;
    private JLabel lblStatus;

    // Tab 1: Assignments Components
    private DefaultTableModel taskTableModel;
    private JTable taskTable;
    private JTextField txtSearchTask;

    // Tab 2: GPA Calculator Components
    private DefaultTableModel courseTableModel;
    private JTable courseTable;
    private JLabel lblCalculatedSgpa;
    private JLabel lblClassification;
    private JLabel lblTotalCredits;
    private JTextField txtCourseCode;
    private JTextField txtCourseName;
    private JComboBox<String> cmbCredits;
    private JComboBox<String> cmbGrade;

    // Tab 3: Pomodoro Timer Components
    private FocusTimerService timerService;
    private JLabel lblTimerDisplay;
    private JLabel lblTimerMode;
    private JButton btnTimerStart;
    private JButton btnTimerPause;
    private JButton btnTimerReset;

    // Tab 4: Flashcards Components
    private int currentFlashcardIndex = 0;
    private JLabel lblCardSubject;
    private JLabel lblCardCounter;
    private JTextArea txtCardContent;
    private JButton btnRevealAnswer;
    private JButton btnMarkMastered;
    private boolean isAnswerRevealed = false;

    public CampusFlowGUI(AppData data) {
        super("CampusFlow • Student Academic Productivity Hub");
        this.data = (data != null) ? data : new AppData();
        initUI();
    }

    private void initUI() {
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(1000, 680);
        setLocationRelativeTo(null);
        getContentPane().setBackground(BG_LIGHT);
        setLayout(new BorderLayout(0, 10));

        // 1. Top Header Banner
        add(createHeaderPanel(), BorderLayout.NORTH);

        // 2. Center Tabs
        tabbedPane = new JTabbedPane();
        tabbedPane.setFont(new Font("Segoe UI", Font.BOLD, 13));
        tabbedPane.setBackground(BG_LIGHT);

        tabbedPane.addTab("📋  Assignments & Deadlines", createAssignmentsTab());
        tabbedPane.addTab("🎓  CGPA / SGPA Calculator", createGpaCalculatorTab());
        tabbedPane.addTab("⏱️  Pomodoro Focus Study Timer", createPomodoroTab());
        tabbedPane.addTab("💡  Revision Flashcards", createFlashcardsTab());

        add(tabbedPane, BorderLayout.CENTER);

        // 3. Bottom Action Bar
        add(createBottomBar(), BorderLayout.SOUTH);

        // Initial Data Sync
        refreshTaskTable();
        refreshCourseTable();
        updateSummaryStats();
        updateFlashcardView();
    }

    private JPanel createHeaderPanel() {
        JPanel header = new JPanel(new BorderLayout(15, 0));
        header.setBackground(CARD_BG);
        header.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createMatteBorder(0, 0, 1, 0, BORDER_COLOR),
            new EmptyBorder(14, 20, 14, 20)
        ));

        // Left Branding
        JPanel left = new JPanel(new GridLayout(2, 1, 0, 3));
        left.setOpaque(false);
        JLabel title = new JLabel("CampusFlow  •  Academic Hub");
        title.setFont(new Font("Segoe UI", Font.BOLD, 20));
        title.setForeground(PASTEL_PURPLE_TEXT);

        JLabel sub = new JLabel("Student: " + data.getStudentName() + " | Roll: " + data.getStudentRoll() + " | Dept: UIE");
        sub.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        sub.setForeground(TEXT_MUTED);

        left.add(title);
        left.add(sub);
        header.add(left, BorderLayout.WEST);

        // Right Quick Stats Badges
        JPanel right = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 2));
        right.setOpaque(false);

        lblSgpaBadge = createPillBadge("SGPA: 9.30", PASTEL_PURPLE_BG, PASTEL_PURPLE_TEXT);
        lblPendingBadge = createPillBadge("2 Deadlines Due", PASTEL_CORAL_BG, PASTEL_CORAL_TEXT);
        lblPomodoroBadge = createPillBadge("4 Focus Sessions", PASTEL_MINT_BG, PASTEL_MINT_TEXT);

        right.add(lblSgpaBadge);
        right.add(lblPendingBadge);
        right.add(lblPomodoroBadge);

        header.add(right, BorderLayout.EAST);
        return header;
    }

    private JLabel createPillBadge(String text, Color bg, Color fg) {
        JLabel lbl = new JLabel(text);
        lbl.setFont(new Font("Segoe UI", Font.BOLD, 12));
        lbl.setOpaque(true);
        lbl.setBackground(bg);
        lbl.setForeground(fg);
        lbl.setBorder(BorderFactory.createCompoundBorder(
            new LineBorder(bg, 1, true),
            new EmptyBorder(5, 12, 5, 12)
        ));
        return lbl;
    }

    // -------------------------------------------------------------
    // TAB 1: ASSIGNMENTS & DEADLINES
    // -------------------------------------------------------------
    private JPanel createAssignmentsTab() {
        JPanel panel = new JPanel(new BorderLayout(10, 10));
        panel.setBackground(BG_LIGHT);
        panel.setBorder(new EmptyBorder(15, 15, 15, 15));

        // Top Controls: Search + Add Task Button
        JPanel topBar = new JPanel(new BorderLayout(10, 0));
        topBar.setOpaque(false);

        JPanel searchPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 0));
        searchPanel.setOpaque(false);
        searchPanel.add(new JLabel("Filter Subject:"));
        txtSearchTask = new JTextField(15);
        JButton btnSearch = createStyledButton("Search", PASTEL_BLUE_BG, PASTEL_BLUE_TEXT);
        JButton btnResetSearch = createStyledButton("Reset", BG_LIGHT, TEXT_MUTED);
        btnSearch.addActionListener(e -> filterTasks(txtSearchTask.getText().trim()));
        btnResetSearch.addActionListener(e -> {
            txtSearchTask.setText("");
            refreshTaskTable();
        });
        searchPanel.add(txtSearchTask);
        searchPanel.add(btnSearch);
        searchPanel.add(btnResetSearch);
        topBar.add(searchPanel, BorderLayout.WEST);

        JButton btnAddTask = createStyledButton("+ Add Assignment", PASTEL_PURPLE_BG, PASTEL_PURPLE_TEXT);
        btnAddTask.addActionListener(e -> showAddTaskDialog());
        topBar.add(btnAddTask, BorderLayout.EAST);

        panel.add(topBar, BorderLayout.NORTH);

        // Center Table
        String[] cols = {"Task Title", "Subject / Module", "Due Date", "Priority", "Estimated Hrs", "Status", "Urgency"};
        taskTableModel = new DefaultTableModel(cols, 0) {
            @Override
            public boolean isCellEditable(int r, int c) { return false; }
        };
        taskTable = new JTable(taskTableModel);
        styleTable(taskTable);

        JScrollPane scrollPane = new JScrollPane(taskTable);
        scrollPane.setBorder(new LineBorder(BORDER_COLOR, 1));
        scrollPane.getViewport().setBackground(CARD_BG);
        panel.add(scrollPane, BorderLayout.CENTER);

        // Bottom Table Actions
        JPanel actions = new JPanel(new FlowLayout(FlowLayout.LEFT, 10, 5));
        actions.setOpaque(false);

        JButton btnMarkDone = createStyledButton("✓ Mark Completed", PASTEL_MINT_BG, PASTEL_MINT_TEXT);
        JButton btnDelete = createStyledButton("✕ Delete Task", PASTEL_CORAL_BG, PASTEL_CORAL_TEXT);
        JButton btnSortUrgent = createStyledButton("⚡ Sort by Priority/Date", PASTEL_AMBER_BG, PASTEL_AMBER_TEXT);

        btnMarkDone.addActionListener(e -> markSelectedTaskDone());
        btnDelete.addActionListener(e -> deleteSelectedTask());
        btnSortUrgent.addActionListener(e -> {
            Collections.sort(data.getAssignments());
            refreshTaskTable();
            setStatus("Tasks sorted by priority and due date.");
        });

        actions.add(btnMarkDone);
        actions.add(btnDelete);
        actions.add(btnSortUrgent);
        panel.add(actions, BorderLayout.SOUTH);

        return panel;
    }

    private void showAddTaskDialog() {
        JDialog dlg = new JDialog(this, "Add New Academic Task", true);
        dlg.setSize(380, 360);
        dlg.setLocationRelativeTo(this);
        dlg.setLayout(new BorderLayout(10, 10));

        JPanel form = new JPanel(new GridLayout(5, 2, 8, 12));
        form.setBorder(new EmptyBorder(15, 15, 15, 15));

        JTextField fTitle = new JTextField();
        JTextField fSubject = new JTextField();
        JTextField fDate = new JTextField(LocalDate.now().plusDays(3).toString());
        JComboBox<String> fPriority = new JComboBox<>(new String[]{"High", "Medium", "Low"});
        JTextField fHours = new JTextField("3");

        form.add(new JLabel("Task Title:"));
        form.add(fTitle);
        form.add(new JLabel("Subject:"));
        form.add(fSubject);
        form.add(new JLabel("Due Date (YYYY-MM-DD):"));
        form.add(fDate);
        form.add(new JLabel("Priority Level:"));
        form.add(fPriority);
        form.add(new JLabel("Estimated Hours:"));
        form.add(fHours);

        dlg.add(form, BorderLayout.CENTER);

        JPanel btnPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 10));
        JButton btnSave = createStyledButton("Save Task", PASTEL_PURPLE_BG, PASTEL_PURPLE_TEXT);
        JButton btnCancel = createStyledButton("Cancel", BG_LIGHT, TEXT_MUTED);

        btnSave.addActionListener(e -> {
            try {
                String title = fTitle.getText().trim();
                String subj = fSubject.getText().trim();
                String date = fDate.getText().trim();
                if (title.isEmpty() || subj.isEmpty() || date.isEmpty()) {
                    throw new InvalidDataException("Task title, subject, and due date cannot be empty!");
                }
                int hrs = Integer.parseInt(fHours.getText().trim());
                if (hrs < 0) throw new InvalidDataException("Hours cannot be negative!");

                String id = "T-" + (data.getAssignments().size() + 1);
                AssignmentTask task = new AssignmentTask(id, title, subj, date, (String) fPriority.getSelectedItem(), hrs, "Added via GUI");
                data.getAssignments().add(task);
                refreshTaskTable();
                updateSummaryStats();
                dlg.dispose();
                setStatus("Added assignment: " + title);
            } catch (NumberFormatException ex) {
                JOptionPane.showMessageDialog(dlg, "Estimated hours must be a valid number!", "Validation Error", JOptionPane.ERROR_MESSAGE);
            } catch (InvalidDataException ex) {
                JOptionPane.showMessageDialog(dlg, ex.getMessage(), "Input Validation", JOptionPane.WARNING_MESSAGE);
            }
        });

        btnCancel.addActionListener(e -> dlg.dispose());
        btnPanel.add(btnCancel);
        btnPanel.add(btnSave);
        dlg.add(btnPanel, BorderLayout.SOUTH);
        dlg.setVisible(true);
    }

    private void markSelectedTaskDone() {
        int row = taskTable.getSelectedRow();
        if (row >= 0 && row < data.getAssignments().size()) {
            AssignmentTask task = data.getAssignments().get(row);
            task.setCompleted(true);
            refreshTaskTable();
            updateSummaryStats();
            setStatus("Marked completed: " + task.getTitle());
        } else {
            JOptionPane.showMessageDialog(this, "Please select an assignment from the table first.", "Info", JOptionPane.INFORMATION_MESSAGE);
        }
    }

    private void deleteSelectedTask() {
        int row = taskTable.getSelectedRow();
        if (row >= 0 && row < data.getAssignments().size()) {
            AssignmentTask task = data.getAssignments().remove(row);
            refreshTaskTable();
            updateSummaryStats();
            setStatus("Removed assignment: " + task.getTitle());
        }
    }

    private void filterTasks(String subjectQuery) {
        if (subjectQuery.isEmpty()) {
            refreshTaskTable();
            return;
        }
        taskTableModel.setRowCount(0);
        for (AssignmentTask a : data.getAssignments()) {
            if (a.getSubject().toLowerCase().contains(subjectQuery.toLowerCase())) {
                taskTableModel.addRow(new Object[]{
                    a.getTitle(), a.getSubject(), a.getDueDate(), a.getPriority(),
                    a.getEstimatedHours() + "h", (a.isCompleted() ? "Done" : "Pending"), a.getUrgencyStatus()
                });
            }
        }
    }

    private void refreshTaskTable() {
        taskTableModel.setRowCount(0);
        for (AssignmentTask a : data.getAssignments()) {
            taskTableModel.addRow(new Object[]{
                a.getTitle(), a.getSubject(), a.getDueDate(), a.getPriority(),
                a.getEstimatedHours() + "h", (a.isCompleted() ? "Done" : "Pending"), a.getUrgencyStatus()
            });
        }
    }

    // -------------------------------------------------------------
    // TAB 2: CGPA & SGPA CALCULATOR
    // -------------------------------------------------------------
    private JPanel createGpaCalculatorTab() {
        JPanel panel = new JPanel(new BorderLayout(15, 15));
        panel.setBackground(BG_LIGHT);
        panel.setBorder(new EmptyBorder(15, 15, 15, 15));

        // Top Input Form Card
        JPanel inputCard = new JPanel(new FlowLayout(FlowLayout.LEFT, 12, 10));
        inputCard.setBackground(CARD_BG);
        inputCard.setBorder(BorderFactory.createCompoundBorder(
            new LineBorder(BORDER_COLOR, 1, true),
            new EmptyBorder(10, 15, 10, 15)
        ));

        txtCourseCode = new JTextField(8);
        txtCourseName = new JTextField(14);
        cmbCredits = new JComboBox<>(new String[]{"1.0", "2.0", "3.0", "4.0", "5.0"});
        cmbCredits.setSelectedItem("4.0");
        cmbGrade = new JComboBox<>(new String[]{"A+", "A", "B+", "B", "C+", "C", "D", "F"});

        JButton btnAddCourse = createStyledButton("+ Add Course", PASTEL_PURPLE_BG, PASTEL_PURPLE_TEXT);
        btnAddCourse.addActionListener(e -> addCourseGrade());

        inputCard.add(new JLabel("Code:"));
        inputCard.add(txtCourseCode);
        inputCard.add(new JLabel("Course Name:"));
        inputCard.add(txtCourseName);
        inputCard.add(new JLabel("Credits:"));
        inputCard.add(cmbCredits);
        inputCard.add(new JLabel("Grade:"));
        inputCard.add(cmbGrade);
        inputCard.add(btnAddCourse);

        panel.add(inputCard, BorderLayout.NORTH);

        // Center Table of Courses
        String[] cols = {"Course Code", "Course Name", "Credits", "Letter Grade", "Grade Point", "Weighted Points"};
        courseTableModel = new DefaultTableModel(cols, 0) {
            @Override
            public boolean isCellEditable(int r, int c) { return false; }
        };
        courseTable = new JTable(courseTableModel);
        styleTable(courseTable);

        JScrollPane scrollPane = new JScrollPane(courseTable);
        scrollPane.setBorder(new LineBorder(BORDER_COLOR, 1));
        panel.add(scrollPane, BorderLayout.CENTER);

        // Bottom Dashboard Card (SGPA Display & Distinction Analysis)
        JPanel bottomDash = new JPanel(new BorderLayout(15, 0));
        bottomDash.setBackground(CARD_BG);
        bottomDash.setBorder(BorderFactory.createCompoundBorder(
            new LineBorder(BORDER_COLOR, 1, true),
            new EmptyBorder(15, 20, 15, 20)
        ));

        JPanel statsLeft = new JPanel(new GridLayout(2, 1, 0, 4));
        statsLeft.setOpaque(false);
        lblCalculatedSgpa = new JLabel("Semester SGPA: 0.00 / 10.00");
        lblCalculatedSgpa.setFont(new Font("Segoe UI", Font.BOLD, 22));
        lblCalculatedSgpa.setForeground(PASTEL_PURPLE_TEXT);

        lblClassification = new JLabel("Academic Standing: Outstanding Performance");
        lblClassification.setFont(new Font("Segoe UI", Font.PLAIN, 13));
        lblClassification.setForeground(TEXT_MUTED);

        statsLeft.add(lblCalculatedSgpa);
        statsLeft.add(lblClassification);
        bottomDash.add(statsLeft, BorderLayout.WEST);

        JPanel statsRight = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 5));
        statsRight.setOpaque(false);
        lblTotalCredits = new JLabel("Total Credits: 0.0");
        lblTotalCredits.setFont(new Font("Segoe UI", Font.BOLD, 14));
        lblTotalCredits.setForeground(TEXT_DARK);

        JButton btnDeleteCourse = createStyledButton("Delete Course", PASTEL_CORAL_BG, PASTEL_CORAL_TEXT);
        btnDeleteCourse.addActionListener(e -> deleteSelectedCourse());

        statsRight.add(lblTotalCredits);
        statsRight.add(btnDeleteCourse);
        bottomDash.add(statsRight, BorderLayout.EAST);

        panel.add(bottomDash, BorderLayout.SOUTH);
        return panel;
    }

    private void addCourseGrade() {
        try {
            String code = txtCourseCode.getText().trim();
            String name = txtCourseName.getText().trim();
            if (code.isEmpty() || name.isEmpty()) {
                throw new InvalidDataException("Please enter course code and course title.");
            }
            double credits = Double.parseDouble((String) cmbCredits.getSelectedItem());
            String grade = (String) cmbGrade.getSelectedItem();

            CourseGrade cg = new CourseGrade(code, name, credits, grade);
            data.getCourses().add(cg);
            txtCourseCode.setText("");
            txtCourseName.setText("");
            refreshCourseTable();
            updateSummaryStats();
            setStatus("Added course: " + code);
        } catch (InvalidDataException ex) {
            JOptionPane.showMessageDialog(this, ex.getMessage(), "Input Required", JOptionPane.WARNING_MESSAGE);
        }
    }

    private void deleteSelectedCourse() {
        int row = courseTable.getSelectedRow();
        if (row >= 0 && row < data.getCourses().size()) {
            data.getCourses().remove(row);
            refreshCourseTable();
            updateSummaryStats();
            setStatus("Removed course from semester calculation.");
        }
    }

    private void refreshCourseTable() {
        courseTableModel.setRowCount(0);
        double totalWeighted = 0;
        double totalCredits = 0;

        for (CourseGrade c : data.getCourses()) {
            courseTableModel.addRow(new Object[]{
                c.getCourseCode(), c.getCourseName(), c.getCredits(),
                c.getLetterGrade(), c.getGradePoint(), String.format("%.1f", c.getWeightedPoints())
            });
            totalWeighted += c.getWeightedPoints();
            totalCredits += c.getCredits();
        }

        double sgpa = (totalCredits > 0) ? (totalWeighted / totalCredits) : 0.0;
        lblCalculatedSgpa.setText(String.format("Semester SGPA: %.2f / 10.00", sgpa));
        lblTotalCredits.setText(String.format("Total Credits: %.1f", totalCredits));

        if (sgpa >= 9.0) {
            lblClassification.setText("Academic Standing: Outstanding Performance (First Class with Distinction)");
        } else if (sgpa >= 7.5) {
            lblClassification.setText("Academic Standing: Very Good (First Class)");
        } else if (sgpa >= 6.0) {
            lblClassification.setText("Academic Standing: Good (Second Class)");
        } else if (totalCredits == 0) {
            lblClassification.setText("Academic Standing: No courses enrolled yet.");
        } else {
            lblClassification.setText("Academic Standing: Needs Improvement");
        }
    }

    // -------------------------------------------------------------
    // TAB 3: MULTITHREADED POMODORO FOCUS TIMER
    // -------------------------------------------------------------
    private JPanel createPomodoroTab() {
        JPanel panel = new JPanel(new GridBagLayout());
        panel.setBackground(BG_LIGHT);

        JPanel timerCard = new JPanel(new BorderLayout(0, 20));
        timerCard.setBackground(CARD_BG);
        timerCard.setPreferredSize(new Dimension(500, 380));
        timerCard.setBorder(BorderFactory.createCompoundBorder(
            new LineBorder(BORDER_COLOR, 1, true),
            new EmptyBorder(30, 40, 30, 40)
        ));

        // Top Mode Indicator
        JPanel top = new JPanel(new FlowLayout(FlowLayout.CENTER));
        top.setOpaque(false);
        lblTimerMode = createPillBadge("🧠  Deep Focus Study Session (25 min)", PASTEL_PURPLE_BG, PASTEL_PURPLE_TEXT);
        lblTimerMode.setFont(new Font("Segoe UI", Font.BOLD, 14));
        top.add(lblTimerMode);
        timerCard.add(top, BorderLayout.NORTH);

        // Center Countdown Display
        JPanel center = new JPanel(new GridLayout(2, 1, 0, 5));
        center.setOpaque(false);

        lblTimerDisplay = new JLabel("25:00", SwingConstants.CENTER);
        lblTimerDisplay.setFont(new Font("Monospaced", Font.BOLD, 68));
        lblTimerDisplay.setForeground(PASTEL_PURPLE_TEXT);

        JLabel tip = new JLabel("Stay locked in. No multitasking during session.", SwingConstants.CENTER);
        tip.setFont(new Font("Segoe UI", Font.ITALIC, 12));
        tip.setForeground(TEXT_MUTED);

        center.add(lblTimerDisplay);
        center.add(tip);
        timerCard.add(center, BorderLayout.CENTER);

        // Bottom Controls
        JPanel bottom = new JPanel(new BorderLayout(0, 15));
        bottom.setOpaque(false);

        JPanel btnRow = new JPanel(new FlowLayout(FlowLayout.CENTER, 15, 0));
        btnRow.setOpaque(false);

        btnTimerStart = createStyledButton("▶  Start Focus", PASTEL_PURPLE_BG, PASTEL_PURPLE_TEXT);
        btnTimerPause = createStyledButton("⏸  Pause", BG_LIGHT, TEXT_DARK);
        btnTimerReset = createStyledButton("🔄  Reset", PASTEL_CORAL_BG, PASTEL_CORAL_TEXT);

        btnTimerStart.addActionListener(e -> startPomodoro(25, false));
        btnTimerPause.addActionListener(e -> togglePauseTimer());
        btnTimerReset.addActionListener(e -> resetPomodoro());

        btnRow.add(btnTimerStart);
        btnRow.add(btnTimerPause);
        btnRow.add(btnTimerReset);

        // Break Buttons
        JPanel breakRow = new JPanel(new FlowLayout(FlowLayout.CENTER, 10, 0));
        breakRow.setOpaque(false);
        JButton btnShortBreak = createStyledButton("☕ Short Break (5m)", PASTEL_MINT_BG, PASTEL_MINT_TEXT);
        JButton btnLongBreak = createStyledButton("🌴 Long Break (15m)", PASTEL_BLUE_BG, PASTEL_BLUE_TEXT);

        btnShortBreak.addActionListener(e -> startPomodoro(5, true));
        btnLongBreak.addActionListener(e -> startPomodoro(15, true));

        breakRow.add(btnShortBreak);
        breakRow.add(btnLongBreak);

        bottom.add(btnRow, BorderLayout.NORTH);
        bottom.add(breakRow, BorderLayout.SOUTH);
        timerCard.add(bottom, BorderLayout.SOUTH);

        panel.add(timerCard);

        // Initialize Timer Service with Callback
        timerService = new FocusTimerService(25, new FocusTimerService.TimerListener() {
            @Override
            public void onTick(int secondsRemaining, String formattedTime) {
                SwingUtilities.invokeLater(() -> lblTimerDisplay.setText(formattedTime));
            }

            @Override
            public void onTimerComplete(boolean isBreak) {
                SwingUtilities.invokeLater(() -> {
                    if (!isBreak) {
                        data.incrementPomodoros();
                        updateSummaryStats();
                        JOptionPane.showMessageDialog(CampusFlowGUI.this,
                            "🎉 Focus Session Complete! Great job, take a 5-minute break.",
                            "Session Concluded", JOptionPane.INFORMATION_MESSAGE);
                    } else {
                        JOptionPane.showMessageDialog(CampusFlowGUI.this,
                            "Break time is over! Ready for the next focus sprint?",
                            "Break Ended", JOptionPane.INFORMATION_MESSAGE);
                    }
                    resetPomodoro();
                });
            }

            @Override
            public void onStateChange(FocusTimerService.TimerState state) {
                SwingUtilities.invokeLater(() -> {
                    if (state == FocusTimerService.TimerState.RUNNING) {
                        btnTimerPause.setText("⏸  Pause");
                    } else if (state == FocusTimerService.TimerState.PAUSED) {
                        btnTimerPause.setText("▶  Resume");
                    }
                });
            }
        });

        return panel;
    }

    private void startPomodoro(int minutes, boolean isBreak) {
        if (isBreak) {
            lblTimerMode.setText("☕  Rest & Recharge Break (" + minutes + " min)");
            lblTimerMode.setBackground(PASTEL_MINT_BG);
            lblTimerMode.setForeground(PASTEL_MINT_TEXT);
            lblTimerDisplay.setForeground(PASTEL_MINT_TEXT);
        } else {
            lblTimerMode.setText("🧠  Deep Focus Study Session (" + minutes + " min)");
            lblTimerMode.setBackground(PASTEL_PURPLE_BG);
            lblTimerMode.setForeground(PASTEL_PURPLE_TEXT);
            lblTimerDisplay.setForeground(PASTEL_PURPLE_TEXT);
        }
        timerService.start(minutes, isBreak);
        setStatus("Multithreaded timer started (" + minutes + " minutes)");
    }

    private void togglePauseTimer() {
        if (timerService.isRunning()) {
            timerService.pause();
            setStatus("Timer paused.");
        } else if (timerService.isPaused()) {
            timerService.resume();
            setStatus("Timer resumed.");
        }
    }

    private void resetPomodoro() {
        timerService.stop();
        lblTimerDisplay.setText("25:00");
        lblTimerMode.setText("🧠  Deep Focus Study Session (25 min)");
        lblTimerMode.setBackground(PASTEL_PURPLE_BG);
        lblTimerMode.setForeground(PASTEL_PURPLE_TEXT);
        lblTimerDisplay.setForeground(PASTEL_PURPLE_TEXT);
        btnTimerPause.setText("⏸  Pause");
        setStatus("Timer reset.");
    }

    // -------------------------------------------------------------
    // TAB 4: REVISION FLASHCARDS
    // -------------------------------------------------------------
    private JPanel createFlashcardsTab() {
        JPanel panel = new JPanel(new GridBagLayout());
        panel.setBackground(BG_LIGHT);

        JPanel cardBox = new JPanel(new BorderLayout(0, 15));
        cardBox.setBackground(CARD_BG);
        cardBox.setPreferredSize(new Dimension(580, 380));
        cardBox.setBorder(BorderFactory.createCompoundBorder(
            new LineBorder(BORDER_COLOR, 1, true),
            new EmptyBorder(25, 30, 25, 30)
        ));

        // Top Bar: Subject & Count
        JPanel top = new JPanel(new BorderLayout());
        top.setOpaque(false);
        lblCardSubject = createPillBadge("Object Oriented Programming", PASTEL_BLUE_BG, PASTEL_BLUE_TEXT);
        lblCardCounter = new JLabel("Card 1 of 3");
        lblCardCounter.setFont(new Font("Segoe UI", Font.BOLD, 12));
        lblCardCounter.setForeground(TEXT_MUTED);

        top.add(lblCardSubject, BorderLayout.WEST);
        top.add(lblCardCounter, BorderLayout.EAST);
        cardBox.add(top, BorderLayout.NORTH);

        // Center Content Area
        txtCardContent = new JTextArea();
        txtCardContent.setFont(new Font("Segoe UI", Font.PLAIN, 16));
        txtCardContent.setForeground(TEXT_DARK);
        txtCardContent.setLineWrap(true);
        txtCardContent.setWrapStyleWord(true);
        txtCardContent.setEditable(false);
        txtCardContent.setBackground(new Color(250, 252, 255));
        txtCardContent.setBorder(BorderFactory.createCompoundBorder(
            new LineBorder(BORDER_COLOR, 1, true),
            new EmptyBorder(20, 20, 20, 20)
        ));

        cardBox.add(txtCardContent, BorderLayout.CENTER);

        // Bottom Controls
        JPanel bottom = new JPanel(new BorderLayout(0, 10));
        bottom.setOpaque(false);

        JPanel navButtons = new JPanel(new FlowLayout(FlowLayout.CENTER, 12, 0));
        navButtons.setOpaque(false);

        JButton btnPrev = createStyledButton("◀  Prev", BG_LIGHT, TEXT_DARK);
        btnRevealAnswer = createStyledButton("👁  Reveal Answer", PASTEL_AMBER_BG, PASTEL_AMBER_TEXT);
        btnMarkMastered = createStyledButton("★  Mastered", PASTEL_MINT_BG, PASTEL_MINT_TEXT);
        JButton btnNext = createStyledButton("Next  ▶", BG_LIGHT, TEXT_DARK);

        btnPrev.addActionListener(e -> navigateCard(-1));
        btnNext.addActionListener(e -> navigateCard(1));
        btnRevealAnswer.addActionListener(e -> toggleFlashcardAnswer());
        btnMarkMastered.addActionListener(e -> toggleMastered());

        navButtons.add(btnPrev);
        navButtons.add(btnRevealAnswer);
        navButtons.add(btnMarkMastered);
        navButtons.add(btnNext);

        JPanel addCardRow = new JPanel(new FlowLayout(FlowLayout.RIGHT, 0, 0));
        addCardRow.setOpaque(false);
        JButton btnNewCard = createStyledButton("+ Add Flashcard", PASTEL_PURPLE_BG, PASTEL_PURPLE_TEXT);
        btnNewCard.addActionListener(e -> showAddFlashcardDialog());
        addCardRow.add(btnNewCard);

        bottom.add(navButtons, BorderLayout.NORTH);
        bottom.add(addCardRow, BorderLayout.SOUTH);
        cardBox.add(bottom, BorderLayout.SOUTH);

        panel.add(cardBox);
        return panel;
    }

    private void updateFlashcardView() {
        if (data.getFlashcards().isEmpty()) {
            txtCardContent.setText("No flashcards found. Click '+ Add Flashcard' to create revision questions!");
            lblCardCounter.setText("0 of 0");
            return;
        }

        if (currentFlashcardIndex >= data.getFlashcards().size()) currentFlashcardIndex = 0;
        if (currentFlashcardIndex < 0) currentFlashcardIndex = data.getFlashcards().size() - 1;

        Flashcard fc = data.getFlashcards().get(currentFlashcardIndex);
        lblCardSubject.setText(fc.getSubject());
        lblCardCounter.setText("Card " + (currentFlashcardIndex + 1) + " of " + data.getFlashcards().size());

        if (isAnswerRevealed) {
            txtCardContent.setText("ANSWER:\n\n" + fc.getAnswer());
            btnRevealAnswer.setText("👁  Show Question");
        } else {
            txtCardContent.setText("QUESTION:\n\n" + fc.getQuestion());
            btnRevealAnswer.setText("👁  Reveal Answer");
        }

        if (fc.isMastered()) {
            btnMarkMastered.setText("✓ Mastered");
            btnMarkMastered.setBackground(PASTEL_MINT_BG);
            btnMarkMastered.setForeground(PASTEL_MINT_TEXT);
        } else {
            btnMarkMastered.setText("★ Mark Mastered");
            btnMarkMastered.setBackground(BG_LIGHT);
            btnMarkMastered.setForeground(TEXT_MUTED);
        }
    }

    private void toggleFlashcardAnswer() {
        isAnswerRevealed = !isAnswerRevealed;
        updateFlashcardView();
    }

    private void toggleMastered() {
        if (!data.getFlashcards().isEmpty()) {
            Flashcard fc = data.getFlashcards().get(currentFlashcardIndex);
            fc.setMastered(!fc.isMastered());
            updateFlashcardView();
        }
    }

    private void navigateCard(int delta) {
        isAnswerRevealed = false;
        currentFlashcardIndex += delta;
        updateFlashcardView();
    }

    private void showAddFlashcardDialog() {
        JDialog dlg = new JDialog(this, "Add New Flashcard", true);
        dlg.setSize(380, 320);
        dlg.setLocationRelativeTo(this);
        dlg.setLayout(new BorderLayout(10, 10));

        JPanel form = new JPanel(new GridLayout(3, 2, 8, 12));
        form.setBorder(new EmptyBorder(15, 15, 15, 15));

        JTextField fSubject = new JTextField("Java OOP");
        JTextArea fQuestion = new JTextArea(3, 20);
        JTextArea fAnswer = new JTextArea(3, 20);

        form.add(new JLabel("Subject:"));
        form.add(fSubject);
        form.add(new JLabel("Question:"));
        form.add(new JScrollPane(fQuestion));
        form.add(new JLabel("Answer:"));
        form.add(new JScrollPane(fAnswer));

        dlg.add(form, BorderLayout.CENTER);

        JPanel btnPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 10));
        JButton btnSave = createStyledButton("Add Card", PASTEL_PURPLE_BG, PASTEL_PURPLE_TEXT);
        btnSave.addActionListener(e -> {
            String s = fSubject.getText().trim();
            String q = fQuestion.getText().trim();
            String a = fAnswer.getText().trim();
            if (!s.isEmpty() && !q.isEmpty() && !a.isEmpty()) {
                data.getFlashcards().add(new Flashcard("FC-" + (data.getFlashcards().size() + 1), s, q, a));
                currentFlashcardIndex = data.getFlashcards().size() - 1;
                isAnswerRevealed = false;
                updateFlashcardView();
                dlg.dispose();
                setStatus("Flashcard created successfully.");
            }
        });

        btnPanel.add(btnSave);
        dlg.add(btnPanel, BorderLayout.SOUTH);
        dlg.setVisible(true);
    }

    // -------------------------------------------------------------
    // BOTTOM ACTION BAR & STORAGE OPERATIONS
    // -------------------------------------------------------------
    private JPanel createBottomBar() {
        JPanel bar = new JPanel(new BorderLayout(15, 0));
        bar.setBackground(CARD_BG);
        bar.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createMatteBorder(1, 0, 0, 0, BORDER_COLOR),
            new EmptyBorder(10, 20, 10, 20)
        ));

        lblStatus = new JLabel("CampusFlow ready. Pure Java Architecture (No external DB required).");
        lblStatus.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        lblStatus.setForeground(TEXT_MUTED);
        bar.add(lblStatus, BorderLayout.WEST);

        JPanel actions = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 0));
        actions.setOpaque(false);

        JButton btnSave = createStyledButton("💾  Save Workspace", PASTEL_PURPLE_BG, PASTEL_PURPLE_TEXT);
        JButton btnLoad = createStyledButton("📂  Load Workspace", BG_LIGHT, TEXT_DARK);
        JButton btnExport = createStyledButton("📄  Export Summary Report", PASTEL_MINT_BG, PASTEL_MINT_TEXT);

        btnSave.addActionListener(e -> saveApplicationData());
        btnLoad.addActionListener(e -> loadApplicationData());
        btnExport.addActionListener(e -> exportAcademicReport());

        actions.add(btnSave);
        actions.add(btnLoad);
        actions.add(btnExport);

        bar.add(actions, BorderLayout.EAST);
        return bar;
    }

    private void saveApplicationData() {
        try {
            StorageService.save(data, new File("campusflow_data.ser"));
            setStatus("Data saved successfully via Java Object Serialization.");
            JOptionPane.showMessageDialog(this,
                "All student records, tasks, grades, and flashcards saved to 'campusflow_data.ser'!\n(Demonstrates Unit 2 ObjectOutputStream)",
                "Saved", JOptionPane.INFORMATION_MESSAGE);
        } catch (Exception ex) {
            JOptionPane.showMessageDialog(this, "Save error: " + ex.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
        }
    }

    private void loadApplicationData() {
        try {
            File f = new File("campusflow_data.ser");
            if (!f.exists()) {
                JOptionPane.showMessageDialog(this, "No saved workspace found ('campusflow_data.ser').", "Info", JOptionPane.INFORMATION_MESSAGE);
                return;
            }
            AppData loaded = StorageService.load(f);
            if (loaded != null) {
                this.data = loaded;
                refreshTaskTable();
                refreshCourseTable();
                updateSummaryStats();
                updateFlashcardView();
                setStatus("Data loaded successfully via Object Deserialization.");
            }
        } catch (Exception ex) {
            JOptionPane.showMessageDialog(this, "Load error: " + ex.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
        }
    }

    private void exportAcademicReport() {
        try {
            File reportFile = new File("Abhishek_Kumar_Academic_Report.txt");
            double totalWeighted = 0, totalCredits = 0;
            for (CourseGrade c : data.getCourses()) {
                totalWeighted += c.getWeightedPoints();
                totalCredits += c.getCredits();
            }
            double sgpa = (totalCredits > 0) ? (totalWeighted / totalCredits) : 0.0;
            StorageService.exportReport(data, reportFile, sgpa);
            setStatus("Academic report exported to: " + reportFile.getName());
            JOptionPane.showMessageDialog(this,
                "Report successfully generated!\nSaved as: " + reportFile.getAbsolutePath() + "\n(Demonstrates Unit 2 PrintWriter & Character Streams)",
                "Export Complete", JOptionPane.INFORMATION_MESSAGE);
        } catch (Exception ex) {
            JOptionPane.showMessageDialog(this, "Export error: " + ex.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
        }
    }

    private void updateSummaryStats() {
        double totalWeighted = 0, totalCredits = 0;
        for (CourseGrade c : data.getCourses()) {
            totalWeighted += c.getWeightedPoints();
            totalCredits += c.getCredits();
        }
        double sgpa = (totalCredits > 0) ? (totalWeighted / totalCredits) : 0.0;
        lblSgpaBadge.setText(String.format("SGPA: %.2f", sgpa));

        long pending = data.getAssignments().stream().filter(a -> !a.isCompleted()).count();
        lblPendingBadge.setText(pending + " Deadlines Due");
        lblPomodoroBadge.setText(data.getCompletedPomodoros() + " Focus Sessions");
    }

    public void setStatus(String msg) {
        lblStatus.setText(msg);
    }

    // Helper UI styling methods
    public static JButton createStyledButton(String text, Color bg, Color fg) {
        JButton btn = new JButton(text);
        btn.setFont(new Font("Segoe UI", Font.BOLD, 12));
        btn.setBackground(bg);
        btn.setForeground(fg);
        btn.setFocusPainted(false);
        btn.setBorder(BorderFactory.createCompoundBorder(
            new LineBorder(bg.darker(), 1, true),
            new EmptyBorder(7, 14, 7, 14)
        ));
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        return btn;
    }

    private void styleTable(JTable table) {
        table.setRowHeight(32);
        table.setFont(new Font("Segoe UI", Font.PLAIN, 12));
        table.setSelectionBackground(PASTEL_PURPLE_BG);
        table.setSelectionForeground(PASTEL_PURPLE_TEXT);
        table.setGridColor(BORDER_COLOR);
        table.setShowVerticalLines(false);

        JTableHeader header = table.getTableHeader();
        header.setFont(new Font("Segoe UI", Font.BOLD, 12));
        header.setBackground(new Color(241, 245, 249));
        header.setForeground(TEXT_DARK);
        header.setBorder(BorderFactory.createMatteBorder(0, 0, 1, 0, BORDER_COLOR));

        DefaultTableCellRenderer centerRenderer = new DefaultTableCellRenderer();
        centerRenderer.setHorizontalAlignment(SwingConstants.CENTER);
        for (int i = 0; i < table.getColumnCount(); i++) {
            if (i >= 2) table.getColumnModel().getColumn(i).setCellRenderer(centerRenderer);
        }
    }

    public JTabbedPane getTabbedPane() {
        return tabbedPane;
    }

    public AppData getData() {
        return data;
    }
}
