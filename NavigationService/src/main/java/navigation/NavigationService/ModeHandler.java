package navigation.NavigationService;

import navigation.NavigationService.utils.LidarNavigationDisplay;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import navigation.NavigationService.modes.debugDistance;
import navigation.NavigationService.modes.SimpleNavigate;
import navigation.NavigationService.utils.Motor;

enum NavigationModes {NOT_MANAGED_BY_NAVIGATION_CONTROLLER, SIMPLE_NAVIGATE, DEBUG_DISTANCE}


@Service
public class ModeHandler {
    private final Logger log = LoggerFactory.getLogger(this.getClass());

    NavigationModes currentMode = NavigationModes.NOT_MANAGED_BY_NAVIGATION_CONTROLLER;
    static JSONArray lastLidarData;
    static JSONObject lastMotorData;

    public void changeMode(String mode) {
        if (currentMode != NavigationModes.NOT_MANAGED_BY_NAVIGATION_CONTROLLER) stopMode(currentMode);
        switch (mode) {
            case "simpleNavigate":
                currentMode = NavigationModes.SIMPLE_NAVIGATE;
                SimpleNavigate.start();
                break;
            case "debugDistance":
                currentMode = NavigationModes.DEBUG_DISTANCE;
                debugDistance.start();
                break;
            default:
                log.info("mode not managed by NavigationService. mode: {}", mode);
                currentMode = NavigationModes.NOT_MANAGED_BY_NAVIGATION_CONTROLLER;
        }
    }

    public void parseData(JSONObject data) {
        if (data.has("motorData")) {
            lastMotorData = data.getJSONObject("motorData");
        } else if (data.has("lidarScan")) {
            lastLidarData = data.getJSONArray("lidarScan");
        } else if(data.has("navigationData")) {
            return;
        } else {
            log.error("Unknown data origin. data: {}", data);
        }
    }

    public void executeCommand(JSONObject command) {
        switch (currentMode) {
            case SIMPLE_NAVIGATE:
                SimpleNavigate.executeCommand(command);
                break;
            case DEBUG_DISTANCE:
                debugDistance.executeCommand(command);
                break;
            default:
                log.error("execute method of mode: {} not found", currentMode);
        }
    }

    private void stopMode(NavigationModes mode) {
        switch (mode) {
            case SIMPLE_NAVIGATE:
                SimpleNavigate.stop();
                break;
            case DEBUG_DISTANCE:
                debugDistance.stop();
                break;
            default:
                log.error("stop method of mode: {} not found", mode);
        }
        Motor.stopMotors();
        LidarNavigationDisplay.clearNavigationData();
    }

    public static JSONArray getLatestLidarData() {
        return lastLidarData;
    }
    public static JSONObject getLatestMotorData() {
        return lastMotorData;
    }
    public static double[] getCurrentMovement() {
        JSONObject movementTarget = lastMotorData.getJSONObject("movement_target");
        double currentSpeed = movementTarget.getDouble("speed");
        double currentDirection = movementTarget.getDouble("direction");

        return new double[]{currentSpeed, currentDirection};
    }
}
