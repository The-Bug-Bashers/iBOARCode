#include "MotorController.h"
#include "PID.h"
#include "MQTTHandler.h"
#include <mosquitto.h>
#include <gpiod.h>
#include <iostream>
#include <memory>

struct gpiod_chip *chip;
std::unique_ptr<MotorController> motor1Controller;
std::unique_ptr<MotorController> motor2Controller;
std::unique_ptr<MotorController> motor3Controller;

PID pid1 = {0.1, 0.01, 0.05, 0, 0};
PID pid2 = {0.1, 0.01, 0.05, 0, 0};
PID pid3 = {0.1, 0.01, 0.05, 0, 0};

int main() {
    chip = gpiod_chip_open_by_name("gpiochip0");
    if (!chip) {
        std::cerr << "Failed to open gpiochip0." << std::endl;
        return 1;
    }

    motor1Controller = std::make_unique<MotorController>(chip, 4, 27, 22, 14, 15, 1.2, 0.021, 0.3); // Balanced (near to none overshoot): p:1.2, i:0.021, d:0.3
    motor2Controller = std::make_unique<MotorController>(chip, 12, 8, 25, 11, 9, 1.2, 0.021, 0.3); // Fast (fast responses but overshoot + a little jitter): k:1.2, i:0.21, d:0.3
    motor3Controller = std::make_unique<MotorController>(chip, 26, 19, 13, 21, 20, 1.2, 0.021, 0.3);

    mosquitto_lib_init();
    struct mosquitto *mosq = mosquitto_new("MotorController", true, nullptr);
    if (!mosq) {
        std::cerr << "Error: Could not create Mosquitto instance." << std::endl;
        return 1;
    }

    if (mosquitto_connect(mosq, "localhost", 1883, 60) != MOSQ_ERR_SUCCESS) {
        std::cerr << "MQTT connection error." << std::endl;
        mosquitto_destroy(mosq);
        return 1;
    }

    mosquitto_message_callback_set(mosq, onMessage);
    mosquitto_subscribe(mosq, nullptr, "boar/motor/drive", 0);
    std::thread dataThread(publishMotorData, mosq);
    dataThread.detach();

    mosquitto_loop_forever(mosq, -1, 1);

    mosquitto_destroy(mosq);
    mosquitto_lib_cleanup();
    gpiod_chip_close(chip);
    return 0;
}