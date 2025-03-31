package navigation.NavigationService.utils;

import jakarta.annotation.PostConstruct;
import navigation.NavigationService.MQTTHandler;
import navigation.NavigationService.ModeHandler;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;

@Component
public final class LidarUtils {
    private static final Logger log = LoggerFactory.getLogger(LidarUtils.class);
    @Value("${boar.diameter}") private static double BOAR_DIAMETER;
    private static double boarRadius;
    @PostConstruct
    public void init() {
        boarRadius = BOAR_DIAMETER / 2.d;
    }

    /**
     * Calculate the maximum distance the bot can drive in a straight line without colliding with an obstacle.
     * @param targetAngle the angle the bot is driving toward. (0° is straight ahead)
     * @param buffer the buffer distance in cm
     * @return maximum distance the bot can drive in a straight line without colliding with an obstacle
     */
    public static double calculateMaxDrivingDistance(double targetAngle, double buffer) {
        double boarRadiusPlusBuffer = boarRadius + buffer / 100; // convert buffer from cm to m
        JSONArray data = ModeHandler.getLatestLidarData();
        if (data == null) return 14;
        double maxDrivingDistance = 14 - boarRadiusPlusBuffer;

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

            if(currentHalfWidth > boarRadiusPlusBuffer) continue;

            double botSizeCorrection = Math.sqrt(Math.pow(boarRadiusPlusBuffer, 2) - Math.pow(currentHalfWidth, 2));
            double currentMaxDrivingDistance = Math.cos(Math.toRadians(deviationAngle)) * currentDistance - botSizeCorrection;
            if (currentMaxDrivingDistance < maxDrivingDistance) maxDrivingDistance = currentMaxDrivingDistance;
        }
        return maxDrivingDistance;
    }
}
