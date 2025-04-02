package navigation.NavigationService.modes;

import jakarta.annotation.PostConstruct;
import navigation.NavigationService.MQTTHandler;
import navigation.NavigationService.utils.LidarNavigationDisplay;
import navigation.NavigationService.utils.Motor;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import static navigation.NavigationService.utils.Lidar.calculateMaxDrivingDistance;

@Component
public final class DebugNavigate {
    private static final Logger log = LoggerFactory.getLogger(DebugNavigate.class);
    @Value("${mqtt.channel.navigation.data}") private String NAVIGATION_DATA_CHANNEL;
    private static String staticNavigationDataChannel;
    @PostConstruct
    public void init() {
        staticNavigationDataChannel = NAVIGATION_DATA_CHANNEL;
    }

    private static boolean showMaxFrontDistance = false;
    private static volatile boolean drive = false;
    private static double buffer = 0;


    private static ScheduledExecutorService executorService;

    public static void start() {
        executorService = Executors.newSingleThreadScheduledExecutor();
        LidarNavigationDisplay.setNavigationData(0, new JSONArray(), true);

        Runnable task = () -> {
            if (showMaxFrontDistance) {
                double distance = calculateMaxDrivingDistance(0, buffer);
                LidarNavigationDisplay.setNavigationData(buffer, new JSONArray()
                        .put(new JSONObject().put("drawPath", new JSONObject().put("angle", 0).put("distance", distance))), false);
            }
        };

        executorService.scheduleAtFixedRate(task, 0, 250, TimeUnit.MILLISECONDS);
    }

    public static void stop() {
        showMaxFrontDistance = false;

        if (executorService != null && !executorService.isShutdown()) {
            executorService.shutdown();
            try {
                if (!executorService.awaitTermination(1, TimeUnit.SECONDS)) {
                    executorService.shutdownNow();
                }
            } catch (InterruptedException e) {
                executorService.shutdownNow();
            }
        }
    }

    public static void executeCommand(JSONObject command) {
        if (command.has("showMaxFrontDistance")) {
            Motor.stopMotors();
            if (!command.getBoolean("showMaxFrontDistance")) {;
                showMaxFrontDistance = false;
                LidarNavigationDisplay.clearNavigationData();
                return;
            }
            buffer = command.getDouble("buffer");
            showMaxFrontDistance = true;
        }

        else if (command.has("driveToMaxFrontDistance")) {
            if (!command.getBoolean("driveToMaxFrontDistance")) {
                Motor.stopMotors();
                showMaxFrontDistance = false;
                LidarNavigationDisplay.clearNavigationData();
                return;
            }

            buffer = command.getDouble("buffer");
            showMaxFrontDistance = true;
            Motor.driveMaxDistance(0.d, command.getDouble("maxSpeed"), buffer);
        }
    }
}
