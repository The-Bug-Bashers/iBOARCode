package navigation.NavigationService.modes;

import jakarta.annotation.PostConstruct;
import navigation.NavigationService.MQTTHandler;
import navigation.NavigationService.ModeHandler;
import navigation.NavigationService.utils.LidarNavigationDisplay;
import navigation.NavigationService.utils.MotorUtils;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import static navigation.NavigationService.utils.LidarUtils.calculateMaxDrivingDistance;

@Component
public final class DebugNavigate {
    @Value("${mqtt.channel.navigation.data}") private String NAVIGATION_DATA_CHANNEL;
    private static String staticNavigationDataChannel;
    @PostConstruct
    public void init() {
        staticNavigationDataChannel = NAVIGATION_DATA_CHANNEL;
    }

    private static boolean showMaxFrontDistance = false;
    private static boolean drive = false;
    private static double buffer = 0;


    private static ScheduledExecutorService executorService;

    public static void start() {
        executorService = Executors.newSingleThreadScheduledExecutor();

        Runnable task = () -> {
            if (showMaxFrontDistance) {
                double distance = calculateMaxDrivingDistance(0, buffer);
                JSONObject message =
                        new JSONObject().put("navigationData",
                                new JSONArray()
                                        .put(new JSONObject().put("buffer", new JSONObject().put("buffer", buffer)))
                                        .put(new JSONObject().put("drawPath", new JSONObject().put("angle", 0).put("distance", distance)))
                        );

                MQTTHandler.publish(staticNavigationDataChannel, message, 0, false);
            }
        };

        executorService.scheduleAtFixedRate(task, 0, 250, TimeUnit.MILLISECONDS);
    }

    public static void stop() {
        drive = false;
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
        if (command.has("showMaxFrontDistance")) {
            drive = false;
            if (!command.getBoolean("showMaxFrontDistance")) {;
                showMaxFrontDistance = false;
                LidarNavigationDisplay.clearNavigationData();
                return;
            }
            showMaxFrontDistance = true;
            buffer = command.getDouble("buffer");
        }

        else if (command.has("driveToMaxFrontDistance")) {
            if (!command.getBoolean("driveToMaxFrontDistance")) {
                drive = false;
                MotorUtils.stopMotors();
                showMaxFrontDistance = false;
                LidarNavigationDisplay.clearNavigationData();
                return;
            }

            showMaxFrontDistance = true;
            drive = true;
            double buffer = command.getDouble("buffer");
            double maxSpeed = command.getDouble("maxSpeed");
            while (drive) {
                double distance = calculateMaxDrivingDistance(0, buffer);
                if (distance <= 0.d) {
                    MotorUtils.stopMotors();
                    drive = false;
                } else {
                    double currentSpeed = ModeHandler.getCurrentMovement()[0];
                    double speed = MotorUtils.getSpeedToDriveDistance(maxSpeed, currentSpeed, distance);
                    MotorUtils.drive(0.d, speed);
                }
            }

        }
    }
}
