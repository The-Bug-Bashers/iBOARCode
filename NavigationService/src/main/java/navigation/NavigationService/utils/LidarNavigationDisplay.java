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

    public static void clearNavigationData() {
        JSONObject message = new JSONObject().put("navigationData", new JSONArray().put(new JSONObject().put("buffer", new JSONObject().put("buffer", 0))));
        MQTTHandler.publish(staticNavigationDataChannel, message, 2, false);
    }
}
