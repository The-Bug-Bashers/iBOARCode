package api.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

public class CommandWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final String COMMAND_EXAMPLE = "{\"command\": \"desired_command\", \"commandParameter1\": \"desired_parameter\"}";

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();


        JsonNode jsonNode;
        try {
            jsonNode = objectMapper.readTree(payload);
        } catch (Exception e) {
            session.sendMessage(new TextMessage("JSON not formated correctly. Example: " + COMMAND_EXAMPLE));
            return;
        }

        if (!jsonNode.has("command")) {
            session.sendMessage(new TextMessage("Bad Request. Example: " + COMMAND_EXAMPLE));
            return;
        }

        String command = jsonNode.get("command").asText();

        switch (command) {
            case "changeMode":
                session.sendMessage(new TextMessage("changed the mode!")); //TODO: replace with real logic
                break;
            case "drive":
                session.sendMessage(new TextMessage("driving!")); //TODO: replace with real logic
                break;
            default:
                session.sendMessage(new TextMessage("command not found"));
                break;
        }
    }

    // Sends a bad request message along with an example command format.
    private void sendBadRequest(WebSocketSession session) throws Exception {
        String example = "{\"command\": \"desired_command\", \"commandParameter1\": \"desired_parameter\"}";
        session.sendMessage(new TextMessage("Bad Request. Example: " + example));
    }
}
