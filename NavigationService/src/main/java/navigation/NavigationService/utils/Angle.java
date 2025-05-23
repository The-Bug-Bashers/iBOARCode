package navigation.NavigationService.utils;

public final class Angle {
    public static double normalizeAngle(double angle) {
        if (angle < 0) {
            while (angle < 0) {
                angle += 360;
            }
        } else if (angle >= 360) {
            while (angle >= 360) {
                angle -= 360;
            }
        }

        return angle;
    }

    public static double getSmallestDifference(double angleA, double angleB) {
        double difference = Math.abs(angleA - angleB);
        if (difference > 180) {
            difference = 360 - difference;
        }
        return difference;
    }

    public static double[] getAngleArray(int angleCount) {
        double[] angles = new double[angleCount];
        double angleStep = 360.0 / angleCount;
        for (int i = 0; i < angleCount; i++) {
            angles[i] = angleStep * i;
        }
        return angles;
    }
}
