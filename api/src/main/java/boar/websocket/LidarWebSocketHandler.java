package boar.websocket;

import com.fazecast.jSerialComm.SerialPort;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.pi4j.io.gpio.GpioController;
import com.pi4j.io.gpio.GpioFactory;
import com.pi4j.io.gpio.GpioPinDigitalOutput;
import com.pi4j.io.gpio.PinState;
import com.pi4j.io.gpio.RaspiPin;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class LidarWebSocketHandler extends TextWebSocketHandler {
    private static final String PORT_NAME = "/dev/ttyUSB0"; // Adjust as needed
    private static final int BAUD_RATE = 115200;
    private SerialPort lidarPort;
    private ScheduledExecutorService executor;
    private ObjectMapper objectMapper = new ObjectMapper();
    private final Set<WebSocketSession> sessions = new CopyOnWriteArraySet<>();

    // Pi4J GPIO control for motor
    private GpioController gpio;
    private GpioPinDigitalOutput motorPin;

    public LidarWebSocketHandler() {
        // Initialize GPIO for motor control
        gpio = GpioFactory.getInstance();
        // Provision the motor control pin (adjust the pin if needed)
        // Set to LOW so that the motor spins.
        motorPin = gpio.provisionDigitalOutputPin(RaspiPin.GPIO_01, "MotorControl", PinState.LOW);
        System.out.println("Motor control pin set to LOW. Motor should be spinning.");

        openLidar();
    }

    private void openLidar() {
        lidarPort = SerialPort.getCommPort(PORT_NAME);
        lidarPort.setBaudRate(BAUD_RATE);
        if (lidarPort.openPort()) {
            System.out.println("LiDAR connected!");
            startScanning();
        } else {
            System.err.println("Failed to open LiDAR port.");
        }
    }

    private void startScanning() {
        executor = Executors.newScheduledThreadPool(1);
        // Wait 2 seconds to ensure the LiDAR is functional
        executor.scheduleAtFixedRate(() -> {
            try {
                if (lidarPort.bytesAvailable() > 0) {
                    byte[] buffer = new byte[lidarPort.bytesAvailable()];
                    int numRead = lidarPort.readBytes(buffer, buffer.length);
                    if (numRead > 0) {
                        parseAndSendData(buffer);
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }, 2, 100, TimeUnit.MILLISECONDS);
    }

    private void parseAndSendData(byte[] buffer) throws IOException {
        ByteBuffer wrapped = ByteBuffer.wrap(buffer);
        while (wrapped.remaining() >= 5) { // Assuming LiDAR packets are at least 5 bytes
            int angle = wrapped.getShort() & 0xFFFF;     // Extract angle
            int distance = wrapped.getShort() & 0xFFFF;    // Extract distance
            boolean isValid = (wrapped.get() & 0x01) != 0;   // Check validity

            if (isValid) {
                String json = objectMapper.writeValueAsString(new LidarData(angle, distance));
                for (WebSocketSession session : sessions) {
                    try {
                        session.sendMessage(new TextMessage(json));
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                }
            }
        }
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);
        System.out.println("Session added: " + session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, org.springframework.web.socket.CloseStatus status) throws Exception {
        sessions.remove(session);
        System.out.println("Session removed: " + session.getId());
    }

    public void stop() {
        if (executor != null) executor.shutdown();
        if (lidarPort != null) lidarPort.closePort();
        if (gpio != null) gpio.shutdown();
    }

    // Inner class representing LiDAR data
    private static class LidarData {
        public int angle;
        public int distance;

        public LidarData(int angle, int distance) {
            this.angle = angle;
            this.distance = distance;
        }
    }
}
