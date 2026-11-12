package campusflow.model;

import java.io.Serializable;

/**
 * Model representing a study flashcard for quick revision and active recall.
 */
public class Flashcard implements Serializable {
    private static final long serialVersionUID = 1L;

    private String id;
    private String subject;
    private String question;
    private String answer;
    private boolean mastered;

    public Flashcard(String id, String subject, String question, String answer) {
        this.id = id;
        this.subject = subject;
        this.question = question;
        this.answer = answer;
        this.mastered = false;
    }

    public String getId() { return id; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }
    public boolean isMastered() { return mastered; }
    public void setMastered(boolean mastered) { this.mastered = mastered; }
}
