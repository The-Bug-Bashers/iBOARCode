#include <iostream>
#include <mosquitto.h>
#include <rplidar.h>
#include <sl_lidar.h>
#include <sl_lidar_driver.h>
#include <unistd.h>
#include <sstream>
#include <vector>
#include <json/json.h>

using namespace std;
using namespace sl;

#define SERIAL_PORT "/dev/ttyUSB0"
#define MQTT_HOST "localhost"
#define MQTT_PORT 1883
#define MQTT_TOPIC_DATA "boar/lidar/data"
#define MQTT_TOPIC_CONTROL "boar/lidar/control"

// MQTT client
mosquitto *mosq = nullptr;
bool lidar_enabled = false;
ILidarDriver *lidar = nullptr;
IChannel *channel = nullptr;

// Helper to send the full scan data as JSON
void publish_mqtt(const vector<pair<float, float>>& scan_data) {
    std::ostringstream oss;
    oss << "{ \"lidarScan\": [";
    for (size_t i = 0; i < scan_data.size(); i++) {
        if (i > 0) oss << ", ";
        oss << "{ \"angle\": " << scan_data[i].first << ", \"distance\": " << scan_data[i].second << " }";
    }
    oss << "] }";

    std::string msg = oss.str();
    mosquitto_publish(mosq, nullptr, MQTT_TOPIC_DATA, msg.size(), msg.c_str(), 0, false);
}

void on_message(struct mosquitto *mosq, void *userdata, const struct mosquitto_message *message) {
    if (message->payloadlen) {
        string payload((char*)message->payload, message->payloadlen);
        Json::Value root;
        Json::CharReaderBuilder reader;
        std::string errs;
        std::istringstream s(payload);
        if (!Json::parseFromStream(reader, s, &root, &errs)) {
            cerr << "Failed to parse JSON: " << errs << endl;
            return;
        }

        if (root["command"].asString() == "changeLidarState") {
            string state = root["state"].asString();
            if (state == "enabled" && !lidar_enabled) {
                lidar_enabled = true;
                lidar->setMotorSpeed(600);
                LidarScanMode scanMode;
                lidar->startScan(false, true, 0, &scanMode);
                cout << "LIDAR scanning started." << endl;
            } else if (state == "disabled" && lidar_enabled) {
                lidar_enabled = false;
                lidar->stop();
                lidar->setMotorSpeed(0);
                cout << "LIDAR scanning stopped." << endl;
            }
        }
    }
}

int main() {
    mosquitto_lib_init();
    mosq = mosquitto_new("lidar_publisher", true, nullptr);
    if (!mosq) {
        cerr << "Failed to initialize MQTT" << endl;
        return 1;
    }

    mosquitto_message_callback_set(mosq, on_message);
    if (mosquitto_connect(mosq, MQTT_HOST, MQTT_PORT, 60) != MOSQ_ERR_SUCCESS) {
        cerr << "Failed to connect to MQTT broker" << endl;
        return 1;
    }
    mosquitto_subscribe(mosq, nullptr, MQTT_TOPIC_CONTROL, 0);

    auto channelResult = createSerialPortChannel(SERIAL_PORT, 115200);
    if (SL_IS_FAIL(static_cast<sl_result>(channelResult))) {
        cerr << "Failed to create serial channel" << endl;
        return -1;
    }
    channel = channelResult.value;

    auto lidarResult = createLidarDriver();
    if (SL_IS_FAIL(static_cast<sl_result>(lidarResult))) {
        cerr << "Failed to create LIDAR driver" << endl;
        return -1;
    }
    lidar = lidarResult.value;

    if (SL_IS_FAIL(lidar->connect(channel))) {
        cerr << "Failed to connect to LIDAR" << endl;
        return -1;
    }

    lidar->stop();
    lidar->setMotorSpeed(0);

    cout << "Waiting for MQTT commands..." << endl;

    while (true) {
        mosquitto_loop(mosq, 0, 1);
        if (lidar_enabled) {
            sl_lidar_response_measurement_node_hq_t nodes[8192];
            size_t count = sizeof(nodes) / sizeof(nodes[0]);
            if (SL_IS_OK(lidar->grabScanDataHq(nodes, count))) {
                vector<pair<float, float>> scan_data;
                for (size_t i = 0; i < count; i++) {
                    if (nodes[i].dist_mm_q2 != 0) {
                        float angle = (nodes[i].angle_z_q14 * 90.f) / (1 << 14);
                        float distance = nodes[i].dist_mm_q2 / 4.0f / 1000.0f;
                        scan_data.push_back({angle, distance});
                    }
                }
                publish_mqtt(scan_data);
            }
        }
        usleep(50000);
    }

    lidar->stop();
    lidar->setMotorSpeed(0);
    delete lidar;
    delete channel;
    mosquitto_disconnect(mosq);
    mosquitto_destroy(mosq);
    mosquitto_lib_cleanup();
    return 0;
}
