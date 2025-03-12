#include "MQTTHandler.h"
#include "MotorControl.h"
#include "MotorController.h"
#include <iostream>
#include <cmath>
#include <nlohmann/json.hpp>
#include "PID.h"
#include <chrono>
#include <thread>

extern PID pid1, pid2, pid3;

extern MotorController *motor1Controller;
extern MotorController *motor2Controller;
extern MotorController *motor3Controller;

void onMessage(struct mosquitto *mosq, void *obj, const struct mosquitto_message *message) {
    if (message->payloadlen > 0) {
        try {
            auto jsonPayload = nlohmann::json::parse((char *)message->payload);
            if (!jsonPayload.contains("command") || !jsonPayload.contains("angle") || !jsonPayload.contains("speed")) {
                std::cerr << "Invalid JSON format: missing required fields." << std::endl;
                return;
            }

            std::string command = jsonPayload["command"];
            if (command != "drive") {
                return;
            }

            double angle = jsonPayload["angle"];
            double speed = jsonPayload["speed"];

            double radians = angle * M_PI / 180.0;
            double vx = speed * sin(radians);
            double vy = speed * cos(radians);

            double m1, m2, m3;
            calculateMotorSpeeds(vx, vy, 0, m1, m2, m3);

            double actualSpeed1 = motor1Controller->getActualSpeed();
            double actualSpeed2 = motor2Controller->getActualSpeed();
            double actualSpeed3 = motor3Controller->getActualSpeed();

            motor1Controller->setSpeed(computePID(pid1, m1, actualSpeed1));
            motor2Controller->setSpeed(computePID(pid2, m2, actualSpeed2));
            motor3Controller->setSpeed(computePID(pid3, m3, actualSpeed3));

        } catch (const std::exception &e) {
            std::cerr << "JSON parsing error: " << e.what() << std::endl;
        }
    }

    void publishMotorData(struct mosquitto *mosq) {
        while (true) {
            double target1, actual1, target2, actual2, target3, actual3;

            motor1Controller->getMotorData(target1, actual1);
            motor2Controller->getMotorData(target2, actual2);
            motor3Controller->getMotorData(target3, actual3);

            nlohmann::json data = {
                {"motor1", {{"target", target1}, {"actual", actual1}}},
                {"motor2", {{"target", target2}, {"actual", actual2}}},
                {"motor3", {{"target", target3}, {"actual", actual3}}}
            };

            std::string message = data.dump();
            mosquitto_publish(mosq, NULL, "boar/motor/data", message.length(), message.c_str(), 0, false);

            std::cout << "[MQTT] Sent motor data: " << message << std::endl;

            std::this_thread::sleep_for(std::chrono::seconds(1));
        }
    }
}
