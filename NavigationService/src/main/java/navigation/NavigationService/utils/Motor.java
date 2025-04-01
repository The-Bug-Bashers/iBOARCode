package navigation.NavigationService.utils;

import jakarta.annotation.PostConstruct;
import navigation.NavigationService.ModeHandler;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import navigation.NavigationService.MQTTHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicBoolean;

import static navigation.NavigationService.utils.Lidar.calculateMaxDrivingDistance;

@Component
public final class Motor {
    private static final Logger log = LoggerFactory.getLogger(Motor.class);

    @Value("${mqtt.channel.motor.drive}") private String MOTOR_DRIVE_CHANNEL;
    private static String staticMotorDriveChannel;
    @PostConstruct
    public void init() {
        staticMotorDriveChannel = MOTOR_DRIVE_CHANNEL;
    }

    public static void stopMotors() {
        drive.set(false);
        if (drivingThread != null && drivingThread.isAlive()) {
            drivingThread.interrupt();
            try {
                drivingThread.join();
            } catch (InterruptedException e) {
                log.error("Error stopping driving thread: {}", e.getMessage());
            }
        }
        drive(0, 0);
    }


    public static void drive(double angle, double speed) {
        JSONObject message = new JSONObject().put("command", "drive").put("angle", angle).put("speed", speed);
        MQTTHandler.publish(staticMotorDriveChannel, message, 2, false);
    }

    private static volatile Thread drivingThread = null;
    private static final AtomicBoolean drive = new AtomicBoolean(false);
    public static void driveMaxDistance(double targetAngle, double maxSpeed, double buffer) {
        if (drivingThread != null && drivingThread.isAlive()) {
            drive.set(false);
            try {
                drivingThread.join(); // Wait for the old thread to terminate
            } catch (InterruptedException e) {
                log.error("Failed to join previous driving thread: {}", e.getMessage());
                Thread.currentThread().interrupt();
            }
        }
        if (drivingThread != null && drivingThread.isAlive()) {
            stopMotors();
        }
        drive.set(true);
        drivingThread = new Thread(() -> {
            while (drive.get()) {
                double distance = calculateMaxDrivingDistance(targetAngle, buffer);
                if (distance <= 0.d) {
                    stopMotors();
                    break;
                }

                double currentSpeed = ModeHandler.getCurrentMovement()[0];
                double speed = getSpeedToDriveDistance(maxSpeed, currentSpeed, distance, 0.1);
                drive(targetAngle, speed);

                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    log.error("Thread interrupted. {}", e.getMessage());
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        });
        drivingThread.start();
    }


    private static final double MAX_SPEED_MPS = 0.96;
    private static double currentSpeed = 0.0;
    public static double getSpeedToDriveDistance(double maxSpeedPercent, double currentSpeedPercent, double distance, double deltaTime) {
        double acceleration = 1.0;  // m/s²
        double maxSpeedMps = (maxSpeedPercent / 100.0) * MAX_SPEED_MPS;
        double currentSpeedMps = (currentSpeedPercent / 100.0) * MAX_SPEED_MPS;

        // Define deceleration before using it
        double deceleration = Math.max(1.0, maxSpeedMps / 2);
        double stoppingDistance = (currentSpeedMps * currentSpeedMps) / (2 * deceleration);

        if (distance > stoppingDistance) {
            currentSpeed = Math.min(currentSpeed + (acceleration * deltaTime), maxSpeedMps);
        } else {
            currentSpeed = Math.max(currentSpeed - (deceleration * deltaTime), 0);
        }

        return (currentSpeed / MAX_SPEED_MPS) * 100.0; // Convert back to percentage
    }


}
