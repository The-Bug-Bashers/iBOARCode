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
                if (!jsonMessage.has("mode")) {
                    session.sendMessage(new TextMessage("Error: Missing 'mode' parameter."));
                    return;
                }
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
            case "drive":
                session.sendMessage(new TextMessage("driving!")); //TODO: replace with real logic
                break;
            default:
                session.sendMessage(new TextMessage("command not found"));
                break;
        }
    }

}
