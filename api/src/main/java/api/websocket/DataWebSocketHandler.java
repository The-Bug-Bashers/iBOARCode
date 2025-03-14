package api.websocket;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.eclipse.paho.client.mqttv3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

@Profile("!local")
@Component
public class DataWebSocketHandler extends TextWebSocketHandler {
    private final Logger log = LoggerFactory.getLogger(this.getClass());
    private final Set<WebSocketSession> sessions = Collections.synchronizedSet(new HashSet<>());
    private MqttClient mqttClient;

    @Value("${mqtt.broker.url}") String BROKER_URL;
    @Value("${mqtt.client.data.id}") String CLIENT_ID;
    @Value("${mqtt.channel.motor.data}") String MQTT_TOPIC;

    @PostConstruct
    public void ini() {
        try {
            log.info("Connecting to broker {}", BROKER_URL);
            mqttClient = new MqttClient(BROKER_URL, CLIENT_ID);
            MqttConnectOptions options = new MqttConnectOptions();
            options.setCleanSession(true);
            mqttClient.connect(options);

            mqttClient.subscribe(MQTT_TOPIC, (topic, message) -> {
                String payload = new String(message.getPayload());
                broadcastMessage(payload);
            });
            log.info("Connected: {}, id: {}", mqttClient.isConnected(), mqttClient.getClientId());
        } catch (MqttException e) {
            log.error("Failed to connect to MQTT broker", e);
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
                    log.error("Failed to send WebSocket message", e);
                }
            }
        }
    }

    @PreDestroy
    public void close() {
        try {
            mqttClient.disconnect();
            mqttClient.close();
        } catch (MqttException e) {
            log.error("Failed to close mqttClient", e);
        }
    }

}
