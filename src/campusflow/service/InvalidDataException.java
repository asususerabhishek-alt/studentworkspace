package campusflow.service;

/**
 * Custom Exception demonstrating Exception Hierarchy and Throw/Throws handling.
 * Syllabus Unit 1 (Session 14-15: Exception Handling, try, catch, finally, throw & throws).
 */
public class InvalidDataException extends Exception {
    private static final long serialVersionUID = 1L;

    public InvalidDataException(String message) {
        super(message);
    }

    public InvalidDataException(String message, Throwable cause) {
        super(message, cause);
    }
}
