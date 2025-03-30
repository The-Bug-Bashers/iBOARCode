package navigation.NavigationService.utils;

import jakarta.annotation.PostConstruct;
import navigation.NavigationService.ModeHandler;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import navigation.NavigationService.MQTTHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public final class MotorUtils {
    private static final Logger log = LoggerFactory.getLogger(MQTTHandler.class);
    @Value("${mqtt.channel.motor.drive}") private String MOTOR_DRIVE_CHANNEL;
    @Value("${boar.diameter}") private double BOAR_DIAMETER;

    private static String staticMotorDriveChannel;
    private static double boarRadius;
    @PostConstruct
    public void init() {
        staticMotorDriveChannel = MOTOR_DRIVE_CHANNEL;
        boarRadius = BOAR_DIAMETER / 2.d;
        log.info("Boar radius: {}", boarRadius);
    }

    public static void stopMotors() {
        MQTTHandler.publish(staticMotorDriveChannel, new JSONObject().put("command", "drive").put("angle", 0).put("speed", 0), 2, false);
    }

    public static double calculateMaxDrivingDistance(double targetAngle) {
        JSONArray data = ModeHandler.getLatestLidarData();
        if (data == null) return 14;
        double maxDrivingDistance = 14 - boarRadius;

        final double[] checkAngles = {AngleUtils.normalizeAngle(targetAngle - 90), AngleUtils.normalizeAngle(targetAngle + 90)};
        final double minCheckAngle = Math.min(checkAngles[0], checkAngles[1]);
        final double maxCheckAngle = Math.max(checkAngles[0], checkAngles[1]);
        log.info("targetAngle: {}, maxCheckAngle: {}, minCheckAngle: {}", targetAngle, maxCheckAngle, minCheckAngle);

        for (int i = 0; i < data.length(); i++) {
            JSONObject obj = data.getJSONObject(i);
            double currentAngle = obj.getDouble("angle");
            double currentDistance = obj.getDouble("distance");

            if (currentAngle < maxCheckAngle && currentAngle > minCheckAngle) continue;

            double deviationAngle = AngleUtils.getSmallestDifference(targetAngle, currentAngle);
            double currentHalfWidth = Math.sin(Math.toRadians(deviationAngle)) * currentDistance;

            if(currentHalfWidth > boarRadius) continue;

            double currentMaxDrivingDistance = Math.cos(Math.toRadians(deviationAngle)) * currentDistance - boarRadius;
            if (currentMaxDrivingDistance < maxDrivingDistance) maxDrivingDistance = currentMaxDrivingDistance;
        }
        return maxDrivingDistance;
    }
}
