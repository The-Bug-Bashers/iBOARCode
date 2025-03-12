#ifndef MOTORCONTROLLER_H
#define MOTORCONTROLLER_H

#include <iostream>
#include <thread>
#include <atomic>
#include <gpiod.h>
#include "Encoder.h"


class MotorController {
public:
    MotorController(struct gpiod_chip *chip, int pwm_offset, int forward_offset, int backward_offset, int encoderA, int encoderB);
    ~MotorController();

    double getActualSpeed();
    void setSpeed(double pidOutput);
    void logPinStates(const std::string &motorName);
    void logMotorStatus(double targetSpeed, double pidOutput);
    void getMotorData(double &targetSpeed, double &actualSpeed);


private:
    void pwmLoop();
    std::atomic<int> duty;
    std::atomic<bool> running;
    std::thread pwm_thread;
    struct gpiod_line *pwm_line;
    struct gpiod_line *forward_line;
    struct gpiod_line *backward_line;
    Encoder *encoder;
};

#endif
