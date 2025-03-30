package navigation.NavigationService.modes;

import org.json.JSONObject;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class DebugNavigate {
    private static boolean showMaxFrontDistance = false;

    private static ScheduledExecutorService executorService;
    private static Runnable task;

    public static void start() {
        executorService = Executors.newSingleThreadScheduledExecutor();

        task = () -> {
            System.out.println("Executing task...");

            if (showMaxFrontDistance) {
                System.out.println("Max front distance is being shown.");
            }
        };

        executorService.scheduleAtFixedRate(task, 0, 1, TimeUnit.SECONDS);
    }

    public static void stop() {
        if (executorService != null && !executorService.isShutdown()) {
            executorService.shutdown();
            try {
                if (!executorService.awaitTermination(60, TimeUnit.SECONDS)) {
                    executorService.shutdownNow();
                }
            } catch (InterruptedException e) {
                executorService.shutdownNow();
            }
        }
    }

    public static void executeCommand(JSONObject command) {
        if (command.has("showMaxFrontDistance")) showMaxFrontDistance = command.getBoolean("showMaxFrontDistance");
    }
}
