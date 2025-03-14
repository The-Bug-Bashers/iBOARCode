package api;

import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class MqttPublisher {
    private final Logger log = LoggerFactory.getLogger(this.getClass());

    private MqttClient client;

    public MqttPublisher(
            @Value("${mqtt.broker.url}") String BROKER_URL,
            @Value("${mqtt.client.id}") String CLIENT_ID) {
        try {
            log.info("Connecting to broker {}", BROKER_URL);
            client = new MqttClient(BROKER_URL, CLIENT_ID);
            MqttConnectOptions options = new MqttConnectOptions();
            options.setCleanSession(true);
            client.connect(options);
            log.info("Connected: {}, id: {}", client.isConnected(), client.getClientId());
        } catch (MqttException e) {
            log.error("Failed to connect to MQTT broker", e);
        }
    }

    public String sendMQTTMessage(String topic, String payload, int qos, boolean retained) throws MqttException {
        try {
            MqttMessage message = new MqttMessage(payload.getBytes());
            message.setQos(qos);
            message.setRetained(retained);
            client.publish(topic, message);
            log.debug("Sent MQTT message: {}", payload);
        } catch (MqttException e) {
            log.error("Failed to publish message", e);
            throw e;
        }
        return "command sent: " + payload + " to topic: " + topic;
    }
}
