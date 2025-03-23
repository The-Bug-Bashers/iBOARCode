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

constexpr double MAX_MOTOR_RPM = 500.0;
bool motorsEnabled = true;

void onMessage(struct mosquitto *mosq, void *obj, const struct mosquitto_message *message) {
    if (message->payloadlen > 0) {
        try {
            auto jsonPayload = nlohmann::json::parse((char *)message->payload);
            if (!jsonPayload.contains("command")) {
                std::cerr << "Invalid JSON format: missing required fields." << std::endl;
                return;
            }

            std::string command = jsonPayload["command"];
            if (command == "drive") {
                if (!motorsEnabled) {
                    std::cout << "[MQTT] Motors are disabled. Ignoring drive command.\n";
                    return;
                } else if (!jsonPayload.contains("angle")  || !jsonPayload.contains("speed")) {
                    std::cerr << "Invalid JSON format: missing required fields." << std::endl;
                    return;
                }
                double angle = jsonPayload["angle"];
                double speed = jsonPayload["speed"];

                double radians = angle * M_PI / 180.0;
                double vx = speed * sin(radians);
                double vy = speed * cos(radians);

                double m1, m2, m3;
                calculateMotorSpeeds(vx, vy, 0, m1, m2, m3);

                // Logging
                std::cout << "[MQTT] Received command: " << command
                          << " | Angle: " << angle
                          << " | Speed: " << speed << std::endl;
                std::cout << "[MQTT] Computed motor speeds: M1 = " << m1
                          << ", M2 = " << m2
                          << ", M3 = " << m3 << std::endl;

                motor1Controller->setTargetSpeed((m1 / 100.0) * MAX_MOTOR_RPM);
                motor2Controller->setTargetSpeed((m2 / 100.0) * MAX_MOTOR_RPM);
                motor3Controller->setTargetSpeed((m3 / 100.0) * MAX_MOTOR_RPM);
            } else if (command == "turn") {
                if (!motorsEnabled) {
                    std::cout << "[MQTT] Motors are disabled. Ignoring turn command.\n";
                    return;
                } else if (!jsonPayload.contains("direction")) {
                    std::cerr << "Invalid JSON format: missing required fields." << std::endl;
                    return;
                }
                std::string direction = jsonPayload["direction"];
                double speed = jsonPayload["speed"];

                speed = (speed / 100) * MAX_MOTOR_RPM;
                if (direction == "left") {
                    speed *= -1;
                } else if (direction != "right") return;

                motor1Controller->setTargetSpeed(speed);
                motor2Controller->setTargetSpeed(speed);
                motor3Controller->setTargetSpeed(speed);
            } else if (command == "changeMotorState") {
                std::string state = jsonPayload["state"];
                if (state == "enabled" && ! motorsEnabled) {
                    motorsEnabled = true;
                    motor1Controller->start();
                    motor2Controller->start();
                    motor3Controller->start();

                    publishing = true;
                    std::thread dataThread(publishMotorData, mosq);
                } else if (state == "disabled" && motorsEnabled) {
                    motorsEnabled = false;
                    motor1Controller->setTargetSpeed(0);
                    motor2Controller->setTargetSpeed(0);
                    motor3Controller->setTargetSpeed(0);
                    std::this_thread::sleep_for(std::chrono::seconds(1));

                    motor1Controller->setSpeed(0);
                    motor2Controller->setSpeed(0);
                    motor3Controller->setSpeed(0);
                    std::this_thread::sleep_for(std::chrono::milliseconds(100));

                    motor1Controller->stop();
                    motor2Controller->stop();
                    motor3Controller->stop();

                    publishing = false;
                }
            }

        } catch (const std::exception &e) {
            std::cerr << "JSON parsing error: " << e.what() << std::endl;
        }
    }
}

void publishMotorData(struct mosquitto *mosq) {
    while (publishing) {
        double target1, actual1, pid1_out, target2, actual2, pid2_out, target3, actual3, pid3_out;

        motor1Controller->getMotorData(target1, actual1, pid1_out);
        motor2Controller->getMotorData(target2, actual2, pid2_out);
        motor3Controller->getMotorData(target3, actual3, pid3_out);

        nlohmann::json data = {
            {"motor1", {{"target", target1}, {"actual", actual1}, {"pid_output", pid1_out}}},
            {"motor2", {{"target", target2}, {"actual", actual2}, {"pid_output", pid2_out}}},
            {"motor3", {{"target", target3}, {"actual", actual3}, {"pid_output", pid3_out}}}
        };

        std::string message = data.dump();
        mosquitto_publish(mosq, NULL, "boar/motor/data", message.length(), message.c_str(), 0, false);

        std::cout << "[MQTT] Sent motor data: " << message << std::endl;

        std::this_thread::sleep_for(std::chrono::milliseconds(60));
    }
}
