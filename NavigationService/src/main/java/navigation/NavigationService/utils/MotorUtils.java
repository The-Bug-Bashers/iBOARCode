package navigation.NavigationService.utils;

import jakarta.annotation.PostConstruct;
import org.json.JSONObject;

import navigation.NavigationService.MQTTHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public final class MotorUtils {
    @Value("${mqtt.channel.motor.drive}") private String MOTOR_DRIVE_CHANNEL;

    private static String staticMotorDriveChannel;
    @PostConstruct
    public void init() {
        staticMotorDriveChannel = MOTOR_DRIVE_CHANNEL;  // Initialize static variable
    }

    public static void stopMotors() {
        MQTTHandler.publish(staticMotorDriveChannel, new JSONObject().put("left", 0).put("right", 0), 2, false);
    }
}
