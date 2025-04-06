package navigation.NavigationService.modes;

import navigation.NavigationService.utils.Angle;
import navigation.NavigationService.utils.Lidar;
import navigation.NavigationService.utils.LidarNavigationDisplay;
import navigation.NavigationService.utils.Motor;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import static navigation.NavigationService.utils.Lidar.calculateFurthestDistance;

public final class SimpleNavigate {
    private static final Logger log = LoggerFactory.getLogger(SimpleNavigate.class);

    private static double buffer = 0;
    private static double scanBuffer = 0;
    private static double maxSpeed = 0;
    private static double staticRestrictionZoneWidth = 0;
    private static double[] dynamicRestrictionZone = new double[]{0,0}; // stores: 0: angle, 1: width
    private static double targetDirection = 0;

    private static final String staticRestrictionZoneColour = "darkred";
    private static final String dynamicRestrictionZoneColour = "darkmagenta";
    private static final AtomicBoolean running = new AtomicBoolean(false);
    private static volatile Thread thread = null;
    public static void start() {
        if (thread != null && thread.isAlive()) {
            running.set(false);
            try {
                thread.join(); // Wait for the old thread to terminate
            } catch (InterruptedException e) {
                log.error("Failed to join previous driving thread: {}", e.getMessage());
                Thread.currentThread().interrupt();
            }
        }

        thread = new Thread(() -> {
            while (running.get()) {
                List<Double> targetAnglesList = new ArrayList<>();
                for (double angle : Angle.getAngleArray(360)) {
                    targetAnglesList.add(angle);
                }

                for (int i = 0; i < targetAnglesList.size(); i++) {
                    double angle = targetAnglesList.get(i);
                    if (Angle.getSmallestDifference(angle, Angle.normalizeAngle(targetDirection + 180)) < staticRestrictionZoneWidth / 2 ||
                    Angle.getSmallestDifference(angle, dynamicRestrictionZone[0]) < dynamicRestrictionZone[1] / 2) {
                        targetAnglesList.remove(i);
                        i--; // Adjust the index after removal
                    }
                }

                double[] targetAngles = targetAnglesList.stream().mapToDouble(Double::doubleValue).toArray();
                double[] furthestDriveValues = calculateFurthestDistance(targetAngles, scanBuffer);
                dynamicRestrictionZone[0] = Angle.normalizeAngle(furthestDriveValues[0] +180);

                Motor.driveMaxDistance(furthestDriveValues[0], maxSpeed, buffer);
                LidarNavigationDisplay.setNavigationData(buffer, new JSONArray()
                        .put(new JSONObject().put("drawZone", new JSONObject().put("direction", Angle.normalizeAngle(targetDirection + 180)).put("width", staticRestrictionZoneWidth).put("colour", staticRestrictionZoneColour)))
                        .put(new JSONObject().put("drawZone", new JSONObject().put("direction", dynamicRestrictionZone[0]).put("width", dynamicRestrictionZone[1]).put("colour", dynamicRestrictionZoneColour)))
                        .put(new JSONObject().put("drawPath", new JSONObject().put("angle", furthestDriveValues[0]).put("distance", Lidar.calculateMaxDrivingDistance(furthestDriveValues[0], buffer))))
                        , true);
                try {
                    Thread.sleep(500); //π*a carefully calibrated this value
                } catch (InterruptedException e) {
                    log.error("Thread interrupted. {}", e.getMessage());
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        });
        thread.start();
    }

    public static void stop() {
        running.set(false);
        if (thread != null && thread.isAlive()) {
            thread.interrupt();
            try {
                thread.join();
            } catch (InterruptedException e) {
                log.error("Error stopping driving thread: {}", e.getMessage());
            }
        }
        Motor.stopMotors();
    }

    public static void executeCommand(JSONObject command) {
        if (command.getString("state").equals("disabled")) {
            stop();
            return;
        }
        if (!running.get()) {
            running.set(true);
            start();
        }

        running.set(true);
        maxSpeed = command.getDouble("maxSpeed");
        buffer = command.getDouble("bufferDistance") * 2; // 2 times because buffer gets applied to every side of the robot
        scanBuffer = command.getDouble("scanBufferDistance") * 2; // 2 times because buffer gets applied to every side of the robot
        staticRestrictionZoneWidth = command.getDouble("staticRestrictionZone");
        targetDirection = command.getDouble("targetDirection");
        dynamicRestrictionZone[1] = command.getDouble("dynamicRestrictionZone"); // set width
    }
}
