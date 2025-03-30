package navigation.NavigationService;

import org.eclipse.paho.client.mqttv3.*;
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
            @Value("${mqtt.channel.data}") String DATA_CHANNEL,
            ModeHandler modeHandler) {
        try {
            log.info("Connecting to broker {}", BROKER_URL);
            client = new MqttClient(BROKER_URL, CLIENT_ID);
            MqttConnectOptions options = new MqttConnectOptions();
            options.setCleanSession(true);
            options.setAutomaticReconnect(true);
            client.connect(options);
            log.info("Connected: {}, id: {}", client.isConnected(), client.getClientId());

            client.subscribe(new String[]{MODE_CHANNEL, DATA_CHANNEL, CONTROL_CHANNEL}, new int[]{2, 0, 2});

            client.setCallback(new MqttCallback() {
                @Override
                public void connectionLost(Throwable cause) {
                    log.error("MQTT Connection lost", cause);
                }

                @Override
                public void messageArrived(String topic, MqttMessage message) {
                    String payload = new String(message.getPayload());
                    log.debug("Received message on {}: {}", topic, payload);

                    try {
                        if (topic.equals(MODE_CHANNEL)) {
                            modeHandler.changeMode(payload);
                        } else if (topic.equals(CONTROL_CHANNEL)) {
                            JSONObject json = new JSONObject(payload);
                            modeHandler.executeCommand(json);
                        } else { // channel = one of the data channels (using wildcard)
                            JSONObject json = new JSONObject(payload);
                            modeHandler.parseData(json);
                        }
                    } catch (Exception e) {
                        log.error("Error processing message on topic {}", topic, e);
                    }
                }

                @Override
                public void deliveryComplete(IMqttDeliveryToken token) {
                    log.debug("Message delivered: {}", token.isComplete());
                }
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
