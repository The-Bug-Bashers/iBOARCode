package navigation.NavigationService;

import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.json.JSONObject;

@Service
public class MQTTHandler {
    private static final Logger log = LoggerFactory.getLogger(MQTTHandler.class);
    private static MqttClient client;

    public MQTTHandler(
            @Value("${mqtt.broker.url}") String BROKER_URL,
            @Value("${mqtt.client.id}") String CLIENT_ID,
            @Value("${mqtt.channel.mode}") String MODE_CHANNEL,
            @Value("${mqtt.channel.navigation.control}") String CONTROL_CHANNEL,
            @Value("${mqtt.channel.data}") String DATA_CHANNEL, ModeHandler modeHandler) {
        try {
            log.info("Connecting to broker {}", BROKER_URL);
            client = new MqttClient(BROKER_URL, CLIENT_ID);
            MqttConnectOptions options = new MqttConnectOptions();
            options.setCleanSession(true);
            options.setAutomaticReconnect(true);
            client.connect(options);
            log.info("Connected: {}, id: {}", client.isConnected(), client.getClientId());

            client.subscribe(MODE_CHANNEL, (topic, message) -> {
                String payload = new String(message.getPayload());
                JSONObject json = new JSONObject(payload);
                if ("changeMode".equals(json.optString("command"))) {
                    String mode = json.optString("mode");
                    modeHandler.changeMode(mode);
                } else {
                    log.warn("Mode Command not found: {}", json.optString("command"));
                }
            });

            client.subscribe(DATA_CHANNEL, (topic, message) -> {
                String payload = new String(message.getPayload());
                JSONObject jsonData = new JSONObject(payload);
                modeHandler.parseData(jsonData);
            });

            client.subscribe(CONTROL_CHANNEL, (topic, message) -> {
                String payload = new String(message.getPayload());
                JSONObject parsedCommand = new JSONObject(payload);
                modeHandler.executeCommand(parsedCommand);
            });

        } catch (MqttException e) {
            log.error("Failed to connect to MQTT broker", e);
        }
    }

    public static void publish(String topic, JSONObject payload, int qos, boolean retained) {
        try {
            MqttMessage message = new MqttMessage(payload.toString().getBytes());
            message.setQos(qos);
            message.setRetained(retained);
            client.publish(topic, message);
            log.debug("Sent MQTT message: {}", payload);
        } catch (MqttException e) {
            log.error("Failed to publish message", e);
        }
    }
}
