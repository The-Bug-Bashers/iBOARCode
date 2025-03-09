package api.websocket;

import api.MqttPublisher;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;

public class CommandWebSocketHandler extends TextWebSocketHandler {
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        String COMMAND_EXAMPLE = "{\"command\": \"desired_command\", \"commandParameter1\": \"desired_parameter\"}";

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

        String command = jsonMessage.get("command").asText();
        try {
            executeCommand(command, session);
        } catch (IOException e) {
            session.sendMessage(new TextMessage("Error: Failed to execute command: " + e));
        }
    }

    void executeCommand(String command, WebSocketSession session) throws IOException {
        switch (command) {
            case "changeMode":
                try {
                    final String status = MqttPublisher.sendMQTTMessage("boar/control/mode", "desired_parameter", 2, true); //TODO: send real new mode
                    session.sendMessage(new TextMessage(status));
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
