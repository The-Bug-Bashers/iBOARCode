package navigation.NavigationService.utils;

import jakarta.annotation.PostConstruct;
import navigation.NavigationService.MQTTHandler;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public final class LidarNavigationDisplay {
    @Value("${mqtt.channel.navigation.data}") private String NAVIGATION_DATA_CHANNEL;
    private static String staticNavigationDataChannel;
    @PostConstruct
    public void init() {
        staticNavigationDataChannel = NAVIGATION_DATA_CHANNEL;
    }

    private static volatile boolean running = false;
    private static Thread broadcastThread;
    private static JSONObject currentMessage;



    public static synchronized void clearNavigationData() {
        running = false;
        if (broadcastThread != null) {
            broadcastThread.interrupt();
            broadcastThread = null;
        }
        JSONObject message = new JSONObject().put("navigationData", new JSONArray().put(new JSONObject().put("buffer", new JSONObject().put("buffer", 0))));
        MQTTHandler.publish(staticNavigationDataChannel, message, 2, false);
    }

    public static synchronized void setNavigationData(double buffer, JSONArray navigationData, boolean startScheduling) {
        currentMessage = new JSONObject().put("navigationData",
                new JSONArray()
                        .put(new JSONObject().put("buffer", new JSONObject().put("buffer", buffer)))
                        .putAll(navigationData)
        );

        if (startScheduling && !running) {
            running = true;
            broadcastThread = new Thread(() -> {
                while (running) {
                    MQTTHandler.publish(staticNavigationDataChannel, currentMessage, 0, false);
                    try {
                        Thread.sleep(250);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }
            });
            broadcastThread.start();
        }
    }
}
