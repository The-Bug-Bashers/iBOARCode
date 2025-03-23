#ifndef MOTORCONTROLLER_H
#define MOTORCONTROLLER_H

#include <iostream>
#include <thread>
#include <atomic>
#include <gpiod.h>
#include "Encoder.h"
#include "PID.h"


class MotorController {
public:
    MotorController(struct gpiod_chip *chip, int pwm_offset, int forward_offset, int backward_offset, int encoderA, int encoderB, double kp, double ki, double kd);
    ~MotorController();

    void stop();
    void resetPID();
    void disableMotor();
    void start();

    double getActualSpeed();
    void setSpeed(double pidOutput);
    void logPinStates(const std::string &motorName);
    void getMotorData(double &targetSpeed, double &actualSpeed, double &pidOutput);
    void pidLoop();
    std::thread pid_thread;

    void setTargetSpeed(double speed);



private:
    std::atomic<double> lastMeasuredSpeed;
    double lastPidOutput = 0;
    void pwmLoop();
    std::atomic<double> targetSpeed;
    std::atomic<int> duty;
    std::atomic<bool> running;
    std::thread pwm_thread;
    struct gpiod_line *pwm_line;
    struct gpiod_line *forward_line;
    struct gpiod_line *backward_line;
    Encoder *encoder;
    PID pid;
};

#endif
