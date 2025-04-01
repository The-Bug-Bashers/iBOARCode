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
         if (drive.get()) drive.set(false);
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
        drive.set(true);
        drivingThread = new Thread(() -> {
            while (drive.get()) {
                double distance = calculateMaxDrivingDistance(targetAngle, buffer);
                if (distance <= 0.d) {
                    stopMotors();
                    break;
                }

                double currentSpeed = ModeHandler.getCurrentMovement()[0];
                double speed = getSpeedToDriveDistance(maxSpeed, currentSpeed, distance);
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

    public static double getSpeedToDriveDistance(double maxSpeed, double currentSpeed, double distance) {
        return maxSpeed; //TODO: replace with proper ac-/deceleration calculation
    }
}
