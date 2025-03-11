package api.websocket;

import api.MqttPublisher;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;


public class CommandWebSocketHandler extends TextWebSocketHandler {
    private final ObjectMapper objectMapper = new ObjectMapper();
    private String currentMode = ""; // Stores the current mode

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
            session.sendMessage(new TextMessage("Error: Failed to execute command: " + e));
        }
    }

    void executeCommand(JsonNode  jsonMessage, WebSocketSession session) throws IOException {
        String command = jsonMessage.get("command").asText();


        switch (command) {
            case "changeMode":
                Map<String, Object> changeModeParams = new HashMap<>();
                changeModeParams.put("command", "changeMode");
                changeModeParams.put("mode", Set.of("Remote-Control", "Move-Motor"));
                if (!verifyParams(jsonMessage, session, changeModeParams)) return;

                String mode = jsonMessage.get("mode").asText();
                if (mode.equals(currentMode)) {
                    session.sendMessage(new TextMessage("Error: Mode is already set to " + mode));
                    return;
                }
                try {
                    final String status = MqttPublisher.sendMQTTMessage("boar/control/mode", mode, 2, true);
                    session.sendMessage(new TextMessage(status));
                    currentMode = mode;
                } catch (MqttException e) {
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
                    final String status = MqttPublisher.sendMQTTMessage("boar/motor/move", jsonMessage.toString(), 2, true);
                    session.sendMessage(new TextMessage(status));
                } catch (MqttException e) {
                    session.sendMessage(new TextMessage("Error: Failed to send MQTT message: " + e));
                }
                break;
            default:
                session.sendMessage(new TextMessage("command not found"));
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
