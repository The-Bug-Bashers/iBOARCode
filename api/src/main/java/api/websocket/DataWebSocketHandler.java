package api.websocket;

import org.eclipse.paho.client.mqttv3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

public class DataWebSocketHandler extends TextWebSocketHandler {
    private final Set<WebSocketSession> sessions = Collections.synchronizedSet(new HashSet<>());
    private MqttClient mqttClient;

    @Value("${mqtt.broker.url}") String BROKER_URL;
    @Value("${mqtt.client.id}") String CLIENT_ID;
    @Value("${mqtt.channel.motor.data}") String MQTT_TOPIC;




    public DataWebSocketHandler() {
        MqttClient tempClient = null; //TODO: fix program creasing when could not connect to MQTT server, and tempClient remains null

        try {
            mqttClient = new MqttClient(BROKER_URL, CLIENT_ID);
            MqttConnectOptions options = new MqttConnectOptions();
            options.setCleanSession(true);
            mqttClient.connect(options);

            mqttClient.subscribe(MQTT_TOPIC, (topic, message) -> {
                String payload = new String(message.getPayload());
                broadcastMessage(payload);
            });
        } catch (MqttException e) {
            System.err.println("Failed to connect to MQTT broker: " + e);
        }
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
    }

    private void broadcastMessage(String message) {
        synchronized (sessions) {
            for (WebSocketSession session : sessions) {
                try {
                    session.sendMessage(new TextMessage(message));
                } catch (IOException e) {
                    System.err.println("Failed to send WebSocket message: " + e.getMessage());
                }
            }
        }
    }
}
