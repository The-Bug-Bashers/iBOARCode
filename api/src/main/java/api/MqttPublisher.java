package api;

import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class MqttPublisher {

    private MqttClient client;

    public MqttPublisher(
            @Value("${mqtt.broker.url}") String BROKER_URL,
            @Value("${mqtt.client.id}") String CLIENT_ID) {

        try {
            client = new MqttClient(BROKER_URL, CLIENT_ID);
            MqttConnectOptions options = new MqttConnectOptions();
            options.setCleanSession(true);
            client.connect(options);
        } catch (MqttException e) {
            System.err.println("Failed to connect to MQTT broker: " + e);
        }
    }

    public String sendMQTTMessage(String topic, String payload, int qos, boolean retained) throws MqttException {
        try {
            MqttMessage message = new MqttMessage(payload.getBytes());
            message.setQos(qos);
            message.setRetained(retained);
            client.publish(topic, message);
            System.out.println("Sent MQTT message: " + payload);
        } catch (MqttException e) {
            System.err.println("Failed to publish message: " + e);
            throw e;
        }
        return "command sent: " + payload + " to topic: " + topic;
    }
}
