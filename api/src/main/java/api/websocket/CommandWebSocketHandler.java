package api.websocket;

import api.MqttPublisher;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

@Component
public class CommandWebSocketHandler extends TextWebSocketHandler {
    private final Logger log = LoggerFactory.getLogger(this.getClass());
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final MqttPublisher mqttPublisher;
    private String currentMode = ""; // Stores the current mode
    @Value("${mqtt.channel.mode}") String MQTT_MODE_CHANNEL;
    @Value("${mqtt.channel.motor.move}") String MQTT_MOTOR_MOVE_CHANNEL;
    @Value("${mqtt.channel.motor.control}") String MQTT_MOTOR_CONTROL_CHANNEL;
    @Value("${mqtt.channel.lidar.control}") String MQTT_LIDAR_CONTROL_CHANNEL;
    @Value("${mqtt.channel.motor.drive}") String MQTT_MOTOR_DRIVE_CHANNEL;
    @Value("${mqtt.channel.navigation.control}") String MQTT_NAVIGATION_CHANNEL;

    public CommandWebSocketHandler(MqttPublisher mqttPublisher) {
        this.mqttPublisher = mqttPublisher;
    }

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        final String COMMAND_EXAMPLE = "{\"command\": \"desired_command\", \"commandParameter1\": \"desired_parameter\"}";


        JsonNode jsonMessage;
        try {
            jsonMessage = objectMapper.readTree(payload);
        } catch (Exception e) {
            session.sendMessage(new TextMessage("Error: JSON not formated correctly. Example: " + COMMAND_EXAMPLE));
            return;
        }

        if (!jsonMessage.has("command")) {
            session.sendMessage(new TextMessage("Error: Bad Request. Request needs to include \"command\" attribute. Example: " + COMMAND_EXAMPLE));
            return;
        }

        try {
            executeCommand(jsonMessage, session);
        } catch (IOException e) {
            log.error("Failed to execute command", e);
            session.sendMessage(new TextMessage("Error: Failed to execute command: " + e));
        }
    }

    void executeCommand(JsonNode  jsonMessage, WebSocketSession session) throws IOException {
        String command = jsonMessage.get("command").asText();


        switch (command) {
            case "changeMode":
                Map<String, Object> changeModeParams = new HashMap<>();
                changeModeParams.put("command", "changeMode");
                changeModeParams.put("mode", Set.of("remoteControl", "moveMotor", "simpleNavigate", "debugNavigate"));
                if (!verifyParams(jsonMessage, session, changeModeParams)) return;

                String mode = jsonMessage.get("mode").asText();
                if (mode.equals(currentMode)) {
                    session.sendMessage(new TextMessage("Error: Mode is already set to " + mode));
                    return;
                }
                try {
                    final String status = mqttPublisher.sendMQTTMessage(MQTT_MODE_CHANNEL, mode, 2, true);
                    session.sendMessage(new TextMessage(status));
                    currentMode = mode;
                } catch (MqttException e) {
                    log.error("Failed to send MQTT message", e);
                    session.sendMessage(new TextMessage("Error: Failed to send MQTT message: " + e));
                }
                break;
            case "moveMotor":
                Map<String, Object> moveMotorParams = new HashMap<>();
                moveMotorParams.put("command", "moveMotor");
                moveMotorParams.put("motor", new int[]{1, 3});
                if (jsonMessage.has("pattern")) {
                    moveMotorParams.put("pattern", Set.of("sine", "triangle", "square", "sawtooth"));
                    moveMotorParams.put("time", new int[]{1, 60});
                    moveMotorParams.put("highSpeed", new int[]{-100, 100});
                    moveMotorParams.put("lowSpeed", new int[]{-100, 100});
                } else {
                    moveMotorParams.put("speed", new int[]{-100, 100});
                    }
                if (!verifyParams(jsonMessage, session, moveMotorParams)) return;

                try {
                    final String status = mqttPublisher.sendMQTTMessage(MQTT_MOTOR_MOVE_CHANNEL, jsonMessage.toString(), 1, true);
                    session.sendMessage(new TextMessage(status));
                } catch (MqttException e) {
                    log.error("Failed to send MQTT message", e);
                    session.sendMessage(new TextMessage("Error: Failed to send MQTT message: " + e));
                }
                break;
            case "changeMotorState":
                Map<String, Object> changeMotorStateParams = new HashMap<>();
                changeMotorStateParams.put("command", "changeMotorState");
                changeMotorStateParams.put("state", Set.of("enabled", "disabled"));
                if (!verifyParams(jsonMessage, session, changeMotorStateParams)) return;

                try {
                    final String status = mqttPublisher.sendMQTTMessage(MQTT_MOTOR_CONTROL_CHANNEL, jsonMessage.toString(), 2, true);
                    session.sendMessage(new TextMessage(status));
                } catch (MqttException e) {
                    log.error("Failed to send MQTT message", e);
                    session.sendMessage(new TextMessage("Error: Failed to send MQTT message: " + e));
                }
                break;
            case "drive":
                Map<String, Object> driveParams = new HashMap<>();
                driveParams.put("command", "drive");
                driveParams.put("angle", new int[]{0, 360});
                driveParams.put("speed", new int[]{0, 100});

                if (!verifyParams(jsonMessage, session, driveParams)) return;

                try {
                    final String status = mqttPublisher.sendMQTTMessage(MQTT_MOTOR_DRIVE_CHANNEL, jsonMessage.toString(), 1, true);
                    session.sendMessage(new TextMessage(status));
                } catch (MqttException e) {
                    log.error("Failed to send MQTT message", e);
                    session.sendMessage(new TextMessage("Error: Failed to send MQTT message: " + e));
                }
                break;
            case "turn":
                Map<String, Object> turnParams = new HashMap<>();
                turnParams.put("command", "turn");
                turnParams.put("direction", Set.of("left", "right"));
                turnParams.put("speed", new int[]{0, 100});

                if (!verifyParams(jsonMessage, session, turnParams)) return;

                try {
                    final String status = mqttPublisher.sendMQTTMessage(MQTT_MOTOR_DRIVE_CHANNEL, jsonMessage.toString(), 1, true);
                    session.sendMessage(new TextMessage(status));
                } catch (MqttException e) {
                    log.error("Failed to send MQTT message", e);
                    session.sendMessage(new TextMessage("Error: Failed to send MQTT message: " + e));
                }
                break;
            case "changeLidarState":
                Map<String, Object> changeLidarStateParams = new HashMap<>();
                changeLidarStateParams.put("command", "changeLidarState");
                changeLidarStateParams.put("state", Set.of("enabled", "disabled"));
                if (!verifyParams(jsonMessage, session, changeLidarStateParams)) return;

                try {
                    final String status = mqttPublisher.sendMQTTMessage(MQTT_LIDAR_CONTROL_CHANNEL, jsonMessage.toString(), 2, true);
                    session.sendMessage(new TextMessage(status));
                } catch (MqttException e) {
                    log.error("Failed to send MQTT message", e);
                    session.sendMessage(new TextMessage("Error: Failed to send MQTT message: " + e));
                }
                break;
            case "simpleNavigate":
                Map<String, Object> simpleNavigateParams = new HashMap<>();
                simpleNavigateParams.put("command", "simpleNavigate");
                simpleNavigateParams.put("targetDirection", new int[]{0, 360});
                simpleNavigateParams.put("staticRestrictionZone", new int[]{0, 360});
                simpleNavigateParams.put("dynamicRestrictionZone", new int[]{0, 360});
                simpleNavigateParams.put("bufferDistance", new int[]{0, 500});
                simpleNavigateParams.put("maxSpeed", new int[]{0, 100});
                simpleNavigateParams.put("state", Set.of("enabled", "disabled"));

                if (!verifyParams(jsonMessage, session, simpleNavigateParams)) return;

                try {
                    final String status = mqttPublisher.sendMQTTMessage(MQTT_NAVIGATION_CHANNEL, jsonMessage.toString(), 2, false);
                    session.sendMessage(new TextMessage(status));
                } catch (MqttException e) {
                    log.error("Failed to send MQTT message", e);
                    session.sendMessage(new TextMessage("Error: Failed to send MQTT message: " + e));
                }
                break;
            case "debugNavigate":
                Map<String, Object> debugNavigateParams = new HashMap<>();
                debugNavigateParams.put("command", "debugNavigate");
                if (jsonMessage.has("driveToMaxFrontDistance")) {
                    debugNavigateParams.put("driveToMaxFrontDistance", Set.of("true", "false"));
                    debugNavigateParams.put("buffer", new int[]{0, 500});
                } else {
                    debugNavigateParams.put("showMaxFrontDistance", Set.of("true", "false"));
                }

                if (!verifyParams(jsonMessage, session, debugNavigateParams)) return;

                try {
                    final String status = mqttPublisher.sendMQTTMessage(MQTT_NAVIGATION_CHANNEL, jsonMessage.toString(), 2, false);
                    session.sendMessage(new TextMessage(status));
                } catch (MqttException e) {
                    log.error("Failed to send MQTT message", e);
                    session.sendMessage(new TextMessage("Error: Failed to send MQTT message: " + e));
                }
                break;
            default:
                session.sendMessage(new TextMessage("Error: command not found"));
                break;
        }
    }


    private boolean verifyParams(JsonNode jsonMessage, WebSocketSession session, Map<String, Object> params) throws IOException {
        // Check for unexpected parameters
        Set<String> expectedParams = params.keySet();
        for (Iterator<String> it = jsonMessage.fieldNames(); it.hasNext(); ) {
            String key = it.next();
            if (!expectedParams.contains(key)) {
                session.sendMessage(new TextMessage("Error: Unexpected parameter \"" + key + "\"."));
                return false;
            }
        }

        // Check for missing or wrong arguments
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            String param = entry.getKey();
            Object type = entry.getValue();

            if (!jsonMessage.has(param)) {
                session.sendMessage(new TextMessage("Error: Bad Request. Request needs to include \"" + param + "\" attribute."));
                return false;
            }

            // Check if the parameter is of the correct type
            if (type instanceof int[] range) {
                int value = jsonMessage.get(param).asInt();
                if (value < range[0] || value > range[1]) { // Check if the value is within the specified range
                    session.sendMessage(new TextMessage("Error: Bad Request. \"" + param + "\" must be between " + range[0] + " and " + range[1] + "."));
                    return false;
                }
            } else if (type instanceof Set<?> validStrings) { // Check if the value is one of the specified strings
                String value = jsonMessage.get(param).asText();
                if (!validStrings.contains(value)) {
                    session.sendMessage(new TextMessage("Error: Bad Request. \"" + param + "\" must be one of " + validStrings + "."));
                    return false;
                }
            }
        }
        return true;
    }
}
