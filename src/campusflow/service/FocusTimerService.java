package campusflow.service;

/**
 * Multithreaded Focus Timer service.
 * Demonstrates Syllabus Unit 2 (Multithreading: Thread life cycle, Thread synchronization,
 * Runnable interface, and inter-thread notification).
 */
public class FocusTimerService implements Runnable {

    public interface TimerListener {
        void onTick(int secondsRemaining, String formattedTime);
        void onTimerComplete(boolean isBreak);
        void onStateChange(TimerState state);
    }

    public enum TimerState {
        STOPPED, RUNNING, PAUSED
    }

    private int totalSeconds;
    private int remainingSeconds;
    private volatile boolean running;
    private volatile boolean paused;
    private volatile boolean isBreakMode;
    private Thread workerThread;
    private TimerListener listener;
    private final Object lock = new Object();

    public FocusTimerService(int defaultMinutes, TimerListener listener) {
        this.totalSeconds = defaultMinutes * 60;
        this.remainingSeconds = this.totalSeconds;
        this.listener = listener;
        this.running = false;
        this.paused = false;
        this.isBreakMode = false;
    }

    public synchronized void start(int minutes, boolean isBreak) {
        if (workerThread != null && workerThread.isAlive()) {
            stop();
        }
        this.totalSeconds = minutes * 60;
        this.remainingSeconds = this.totalSeconds;
        this.isBreakMode = isBreak;
        this.running = true;
        this.paused = false;

        workerThread = new Thread(this, "FocusTimer-Thread");
        workerThread.setDaemon(true);
        workerThread.start();
        if (listener != null) listener.onStateChange(TimerState.RUNNING);
    }

    public void pause() {
        synchronized (lock) {
            this.paused = true;
            if (listener != null) listener.onStateChange(TimerState.PAUSED);
        }
    }

    public void resume() {
        synchronized (lock) {
            this.paused = false;
            lock.notifyAll(); // Wake up thread (inter-thread communication)
            if (listener != null) listener.onStateChange(TimerState.RUNNING);
        }
    }

    public synchronized void stop() {
        running = false;
        paused = false;
        synchronized (lock) {
            lock.notifyAll();
        }
        if (workerThread != null) {
            workerThread.interrupt();
            workerThread = null;
        }
        if (listener != null) listener.onStateChange(TimerState.STOPPED);
    }

    @Override
    public void run() {
        try {
            while (running && remainingSeconds > 0) {
                synchronized (lock) {
                    while (paused && running) {
                        lock.wait(); // Thread waiting state
                    }
                }

                if (!running) break;

                Thread.sleep(1000); // 1-second cadence
                remainingSeconds--;

                if (listener != null) {
                    listener.onTick(remainingSeconds, formatTime(remainingSeconds));
                }
            }

            if (running && remainingSeconds <= 0) {
                running = false;
                if (listener != null) {
                    listener.onTimerComplete(isBreakMode);
                    listener.onStateChange(TimerState.STOPPED);
                }
            }
        } catch (InterruptedException e) {
            // Thread interrupted cleanly on stop/reset
            Thread.currentThread().interrupt();
        }
    }

    public static String formatTime(int totalSecs) {
        int m = totalSecs / 60;
        int s = totalSecs % 60;
        return String.format("%02d:%02d", m, s);
    }

    public boolean isRunning() { return running && !paused; }
    public boolean isPaused() { return paused; }
    public boolean isBreakMode() { return isBreakMode; }
}
