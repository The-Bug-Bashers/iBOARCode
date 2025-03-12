#include "MotorController.h"
#include "PID.h"
#include "MotorControl.h"
#include "MQTTHandler.h"
#include <mosquitto.h>
#include <gpiod.h>
#include <iostream>
#include "PID.h"
#include "MQTTHandler.h"

struct gpiod_chip *chip;
MotorController *motor1Controller = nullptr;
MotorController *motor2Controller = nullptr;
MotorController *motor3Controller = nullptr;

PID pid1 = {0.1, 0.01, 0.05, 0, 0};
PID pid2 = {0.1, 0.01, 0.05, 0, 0};
PID pid3 = {0.1, 0.01, 0.05, 0, 0};

int main() {
    chip = gpiod_chip_open_by_name("gpiochip0");
    if (!chip) {
        std::cerr << "Failed to open gpiochip0." << std::endl;
        return 1;
    }

    motor1Controller = new MotorController(chip, 4, 27, 22, 14, 15);
    motor2Controller = new MotorController(chip, 12, 8, 25, 11, 9);
    motor3Controller = new MotorController(chip, 26, 19, 13, 21, 20);

    mosquitto_lib_init();
    struct mosquitto *mosq = mosquitto_new("MotorController", true, NULL);
    if (!mosq) {
        std::cerr << "Error: Could not create Mosquitto instance." << std::endl;
        return 1;
    }

    int ret = mosquitto_connect(mosq, "localhost", 1883, 60);
    if (ret != MOSQ_ERR_SUCCESS) {
        std::cerr << "MQTT connection error: " << mosquitto_strerror(ret) << std::endl;
        mosquitto_destroy(mosq);
        return 1;
    }

    mosquitto_message_callback_set(mosq, onMessage);
    mosquitto_subscribe(mosq, NULL, "boar/motor/drive", 0);

    std::thread dataThread(publishMotorData, mosq);
    dataThread.detach();  // Runs in the background

    ret = mosquitto_loop_forever(mosq, -1, 1);
    if (ret != MOSQ_ERR_SUCCESS) {
        std::cerr << "MQTT loop error: " << mosquitto_strerror(ret) << std::endl;
    }

    mosquitto_destroy(mosq);
    mosquitto_lib_cleanup();
    delete motor1Controller;
    delete motor2Controller;
    delete motor3Controller;
    gpiod_chip_close(chip);
    return 0;
}
