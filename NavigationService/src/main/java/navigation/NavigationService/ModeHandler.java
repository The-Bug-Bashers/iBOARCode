package navigation.NavigationService;

import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import navigation.NavigationService.modes.SimpleNavigate;
import navigation.NavigationService.utils.MotorUtils;

enum NavigationModes {NOT_MANAGED_BY_NAVIGATION_CONTROLLER, SIMPLE_NAVIGATE}


@Service
public class ModeHandler {
    private final Logger log = LoggerFactory.getLogger(this.getClass());

    NavigationModes currentMode;
    JSONArray lastLidarData;
    JSONObject lastMotorData;

    public void changeMode(String mode) {
        if (currentMode != NavigationModes.NOT_MANAGED_BY_NAVIGATION_CONTROLLER) stopMode(currentMode);
        switch (mode) {
            case "simpleNavigate":
                currentMode = NavigationModes.SIMPLE_NAVIGATE;
                SimpleNavigate.start();
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
        } else {
            log.error("Unknown data format: {}", data);
        }
    }

    public void executeCommand(JSONObject command) {
        switch (currentMode) {
            case SIMPLE_NAVIGATE:
                SimpleNavigate.executeCommand(command);
                break;
            default:
                log.error("execute method of mode: {} not found", currentMode);
        }
    }

    private void stopMode(NavigationModes mode) {
        switch (mode) {
            case SIMPLE_NAVIGATE:
                SimpleNavigate.stop();
        }
        MotorUtils.stopMotors();
    }
}
