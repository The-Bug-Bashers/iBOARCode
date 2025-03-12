#include "MQTTHandler.h"
#include "MotorControl.h"
#include "MotorController.h"
#include <iostream>
#include <nlohmann/json.hpp>

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

            motor1Controller->setSpeed(m1);
            motor2Controller->setSpeed(m2);
            motor3Controller->setSpeed(m3);
        } catch (const std::exception &e) {
            std::cerr << "JSON parsing error: " << e.what() << std::endl;
        }
    }
}
