package navigation.NavigationService.utils;

import org.json.JSONObject;

import navigation.NavigationService.MQTTHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public final class MotorUtils {
    @Value("${mqtt.channel.motor.drive}") private static String MOTOR_DRIVE_CHANNEL;

    public static void stopMotors() {
        MQTTHandler.publish(MOTOR_DRIVE_CHANNEL, new JSONObject().put("left", 0).put("right", 0), 2, false);
    }
}
