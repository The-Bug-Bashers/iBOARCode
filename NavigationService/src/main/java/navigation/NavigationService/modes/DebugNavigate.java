package navigation.NavigationService.modes;

import jakarta.annotation.PostConstruct;
import navigation.NavigationService.MQTTHandler;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import static navigation.NavigationService.utils.MotorUtils.calculateMaxDrivingDistance;

@Component
public final class DebugNavigate {
    @Value("${mqtt.channel.navigation.data}") private String NAVIGATION_DATA_CHANNEL;
    private static String staticNavigationDataChannel;
    @PostConstruct
    public void init() {
        staticNavigationDataChannel = NAVIGATION_DATA_CHANNEL;
    }

    private static boolean showMaxFrontDistance = false;

    private static ScheduledExecutorService executorService;

    public static void start() {
        executorService = Executors.newSingleThreadScheduledExecutor();

        Runnable task = () -> {
            if (showMaxFrontDistance) {
                double distance = calculateMaxDrivingDistance(0);

                System.out.println("Max front distance: " + distance);
                JSONObject message = new JSONObject()
                        .put("navigationData", new JSONArray()
                                .put(new JSONObject()
                                        .put("drawPath", new JSONObject()
                                                .put("angle", 0)
                                                .put("distance", distance)
                                        )
                                )
                        );

                MQTTHandler.publish(staticNavigationDataChannel, message, 0, false);
            }
        };

        executorService.scheduleAtFixedRate(task, 0, 250, TimeUnit.MILLISECONDS);
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
