package navigation.NavigationService;

import navigation.NavigationService.modes.SimpleNavigate;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

enum Modes {SIMPLE_NAVIGATE}


@Service
public class ModeHandler {
    private final Logger log = LoggerFactory.getLogger(this.getClass());
    Modes currentMode;
    public void changeMode(String mode) {
        switch (mode) {
            case "simpleNavigate":
                currentMode = Modes.SIMPLE_NAVIGATE;
                break;
            default:
                log.error("mode not found: {}", mode);
        }
    }

    public void parseData(JSONObject data) {
        switch (currentMode) {
            case Modes.SIMPLE_NAVIGATE:
                SimpleNavigate.parseData(data);
                break;
            default:
                log.error("parseData method of mode: {} not found", currentMode);
        }
    }

    public void executeCommand(JSONObject command) {
        switch (currentMode) {
            case Modes.SIMPLE_NAVIGATE:
                SimpleNavigate.executeCommand(command);
                break;
            default:
                log.error("execute method of mode: {} not found", currentMode);
        }
    }
}
