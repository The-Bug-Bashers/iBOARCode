package navigation.NavigationService.modes;

import jakarta.annotation.PostConstruct;
import navigation.NavigationService.MQTTHandler;
import navigation.NavigationService.utils.Angle;
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

import static navigation.NavigationService.utils.Lidar.calculateFurthestDistance;
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

    private static final double[] targetAngles = Angle.getAngleArray(360);
    private static enum mode {NONE, MAX_FRONT_DISTANCE, FURTHEST_DISTANCE, DRIVE_MAX_FRONT_DISTANCE, DRIVE_FURTHEST_DISTANCE}

    private static mode currentMode = mode.NONE;
    private static ScheduledExecutorService executorService;
    private static double buffer = 0;
    private static double maxSpeed = 0;


    public static void start() {
        executorService = Executors.newSingleThreadScheduledExecutor();

        Runnable task = () -> {
            switch (currentMode) {
                case DRIVE_MAX_FRONT_DISTANCE:
                case MAX_FRONT_DISTANCE:
                    double distance = calculateMaxDrivingDistance(0, buffer);
                    LidarNavigationDisplay.setNavigationData(buffer, new JSONArray()
                            .put(new JSONObject().put("drawPath", new JSONObject().put("angle", 0).put("distance", distance))), true);
                    break;
                case FURTHEST_DISTANCE:
                    double[] values = calculateFurthestDistance(targetAngles, buffer);
                    LidarNavigationDisplay.setNavigationData(buffer, new JSONArray()
                        .put(new JSONObject().put("drawPath", new JSONObject().put("angle", values[0]).put("distance", values[1]))), true);
                    break;
                case DRIVE_FURTHEST_DISTANCE:
                    double[] furthestDriveValues = calculateFurthestDistance(targetAngles, buffer);
                    Motor.driveMaxDistance(furthestDriveValues[0], maxSpeed, buffer);
                    LidarNavigationDisplay.setNavigationData(buffer, new JSONArray()
                            .put(new JSONObject().put("drawPath", new JSONObject().put("angle", furthestDriveValues[0]).put("distance", furthestDriveValues[1]))), true);
                    break;
            }
        };

        executorService.scheduleAtFixedRate(task, 0, 250, TimeUnit.MILLISECONDS);
    }

    public static void stop() {
        currentMode = mode.NONE;

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
                currentMode = mode.NONE;
                LidarNavigationDisplay.clearNavigationData();
                return;
            }
            buffer = command.getDouble("buffer");
            currentMode = mode.MAX_FRONT_DISTANCE;
        } else if (command.has("showFurthestDistance")) {
            Motor.stopMotors();
            if (!command.getBoolean("showFurthestDistance")) {;
                currentMode = mode.NONE;
                LidarNavigationDisplay.clearNavigationData();
                return;
            }
            buffer = command.getDouble("buffer");
            currentMode = mode.FURTHEST_DISTANCE;
        } else if (command.has("driveToMaxFrontDistance")) {
            if (!command.getBoolean("driveToMaxFrontDistance")) {
                currentMode = mode.NONE;
                Motor.stopMotors();
                LidarNavigationDisplay.clearNavigationData();
                return;
            }

            buffer = command.getDouble("buffer");
            currentMode = mode.DRIVE_MAX_FRONT_DISTANCE;
            Motor.driveMaxDistance(0.d, command.getDouble("maxSpeed"), buffer);
        } else if (command.has("driveToFurthestDistance")) {
            if (!command.getBoolean("driveToFurthestDistance")) {
                currentMode = mode.NONE;
                Motor.stopMotors();
                LidarNavigationDisplay.clearNavigationData();
                return;
            }

            buffer = command.getDouble("buffer");
            maxSpeed = command.getDouble("maxSpeed");
            currentMode = mode.DRIVE_FURTHEST_DISTANCE;
        }
    }
}
