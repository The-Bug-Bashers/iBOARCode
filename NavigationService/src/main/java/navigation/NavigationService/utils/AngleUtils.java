package navigation.NavigationService.utils;

public class AngleUtils {
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
}
