#include <iostream>
#include <mosquitto.h>
#include <rplidar.h>
#include <sl_lidar.h>
#include <sl_lidar_driver.h>
#include <unistd.h>
#include <sstream>
#include <vector>

using namespace std;
using namespace sl;

#define SERIAL_PORT "/dev/ttyUSB0"
#define MQTT_HOST "localhost"
#define MQTT_PORT 1883
#define MQTT_TOPIC "boar/lidar/data"

// MQTT client
mosquitto *mosq = nullptr;

// Helper to send the full scan data as JSON
void publish_mqtt(const vector<pair<float, float>>& scan_data) {
    // Build JSON string
    std::ostringstream oss;
    oss << "{ \"lidarScan\": [";
    for (size_t i = 0; i < scan_data.size(); i++) {
        if (i > 0) oss << ", ";
        oss << "{ \"angle\": " << scan_data[i].first << ", \"distance\": " << scan_data[i].second << " }";
    }
    oss << "] }";

    std::string msg = oss.str();

    // Publish the scan data to MQTT
    mosquitto_publish(mosq, nullptr, MQTT_TOPIC, msg.size(), msg.c_str(), 0, false);
}

int main() {
    // Initialize MQTT
    mosquitto_lib_init();
    mosq = mosquitto_new("lidar_publisher", true, nullptr);
    if (!mosq) {
        cerr << "Failed to initialize MQTT\n";
        return 1;
    }

    if (mosquitto_connect(mosq, MQTT_HOST, MQTT_PORT, 60) != MOSQ_ERR_SUCCESS) {
        cerr << "Failed to connect to MQTT broker\n";
        return 1;
    }

    // Initialize LIDAR
    auto channelResult = createSerialPortChannel(SERIAL_PORT, 115200);
    if (SL_IS_FAIL(static_cast<sl_result>(channelResult))) {
        cerr << "Failed to create serial channel\n";
        return -1;
    }
    IChannel *channel = channelResult.value;

    auto lidarResult = createLidarDriver();
    if (SL_IS_FAIL(static_cast<sl_result>(lidarResult))) {
        cerr << "Failed to create LIDAR driver\n";
        return -1;
    }
    ILidarDriver *lidar = lidarResult.value;

    auto res = lidar->connect(channel);
    if (SL_IS_FAIL(res)) {
        cerr << "Failed to connect to LIDAR\n";
        return -1;
    }

    // Start motor and scanning
    lidar->setMotorSpeed(600);
    LidarScanMode scanMode;
    lidar->startScan(false, true, 0, &scanMode);

    cout << "LIDAR scanning and publishing to MQTT...\n";

    while (true) {
        sl_lidar_response_measurement_node_hq_t nodes[8192];
        size_t count = sizeof(nodes) / sizeof(nodes[0]);

        auto scanResult = lidar->grabScanDataHq(nodes, count);
        if (SL_IS_OK(scanResult)) {
            vector<pair<float, float>> scan_data;

            // Collect scan data
            for (size_t i = 0; i < count; i++) {
                if (nodes[i].dist_mm_q2 != 0) {
                    float angle = (nodes[i].angle_z_q14 * 90.f) / (1 << 14);
                    float distance = nodes[i].dist_mm_q2 / 4.0f / 1000.0f; // Convert to meters
                    scan_data.push_back({angle, distance});
                }
            }

            // Publish the full scan data once all measurements are collected
            publish_mqtt(scan_data);
        }

        mosquitto_loop(mosq, 0, 1); // Process MQTT network events
        usleep(50000); // 50ms sleep (~20 FPS)
    }

    // Cleanup
    lidar->stop();
    lidar->setMotorSpeed(0);
    delete lidar;
    delete channel;
    mosquitto_disconnect(mosq);
    mosquitto_destroy(mosq);
    mosquitto_lib_cleanup();

    return 0;
}
