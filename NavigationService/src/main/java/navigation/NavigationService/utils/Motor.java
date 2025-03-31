package navigation.NavigationService.utils;

import jakarta.annotation.PostConstruct;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import navigation.NavigationService.MQTTHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public final class Motor {
    private static final Logger log = LoggerFactory.getLogger(MQTTHandler.class);

    @Value("${mqtt.channel.motor.drive}") private String MOTOR_DRIVE_CHANNEL;
    private static String staticMotorDriveChannel;
    @PostConstruct
    public void init() {
        staticMotorDriveChannel = MOTOR_DRIVE_CHANNEL;
    }

    public static void stopMotors() {
        MQTTHandler.publish(staticMotorDriveChannel, new JSONObject().put("command", "drive").put("angle", 0).put("speed", 0), 2, false);
    }

    public static void drive(double angle, double speed) {
        JSONObject message = new JSONObject().put("command", "drive").put("angle", angle).put("speed", speed);
        MQTTHandler.publish(staticMotorDriveChannel, message, 2, false);
    }

    public static double getSpeedToDriveDistance(double maxSpeed, double currentSpeed, double distance) {
        return maxSpeed; //TODO: replace with proper ac-/deceleration calculation
    }
}
