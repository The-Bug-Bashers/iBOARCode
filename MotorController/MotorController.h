#ifndef MOTORCONTROLLER_H
#define MOTORCONTROLLER_H

#include <iostream>
#include <thread>
#include <atomic>
#include <gpiod.h>

class MotorController {
public:
    MotorController(struct gpiod_chip *chip, int pwm_offset, int forward_offset, int backward_offset);
    ~MotorController();
    void setSpeed(double speed);
    void logPinStates(const std::string &motorName);

private:
    void pwmLoop();
    std::atomic<int> duty;
    std::atomic<bool> running;
    std::thread pwm_thread;
    struct gpiod_line *pwm_line;
    struct gpiod_line *forward_line;
    struct gpiod_line *backward_line;
};

#endif
