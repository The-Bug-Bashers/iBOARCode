#include "MotorController.h"
#include <chrono>
#include <cmath>

MotorController::MotorController(struct gpiod_chip *chip, int pwm_offset, int forward_offset, int backward_offset, int encoderA, int encoderB)
: duty(0), running(true) {
    pwm_line = gpiod_chip_get_line(chip, pwm_offset);
    forward_line = gpiod_chip_get_line(chip, forward_offset);
    backward_line = gpiod_chip_get_line(chip, backward_offset);
    encoder = new Encoder(chip, encoderA, encoderB);

    if(gpiod_line_request_output(pwm_line, "MotorController", 0) < 0 ||
       gpiod_line_request_output(forward_line, "MotorController", 0) < 0 ||
       gpiod_line_request_output(backward_line, "MotorController", 0) < 0) {
        std::cerr << "Failed to request GPIO lines." << std::endl;
        exit(1);
    }

    pwm_thread = std::thread(&MotorController::pwmLoop, this);
}

MotorController::~MotorController(){
    running = false;
    if(pwm_thread.joinable())
        pwm_thread.join();

    delete encoder;
    gpiod_line_release(pwm_line);
    gpiod_line_release(forward_line);
    gpiod_line_release(backward_line);
}

double MotorController::getActualSpeed() {
    return encoder->getSpeed();
}

void MotorController::setSpeed(double pidOutput) {
    int newDuty = std::min(255, std::max(0, static_cast<int>(std::fabs(pidOutput))));
    duty.store(newDuty);

    if (pidOutput > 0) {
        gpiod_line_set_value(forward_line, 1);
        gpiod_line_set_value(backward_line, 0);
    } else if (pidOutput < 0) {
        gpiod_line_set_value(forward_line, 0);
        gpiod_line_set_value(backward_line, 1);
    } else {
        gpiod_line_set_value(forward_line, 0);
        gpiod_line_set_value(backward_line, 0);
    }
}


void MotorController::logPinStates(const std::string &motorName) {
    int forwardState = gpiod_line_get_value(forward_line);
    int backwardState = gpiod_line_get_value(backward_line);
    std::cout << motorName << " -> Intended Duty: " << duty.load()
              << ", Forward: " << forwardState
              << ", Backward: " << backwardState << std::endl;
}

void MotorController::pwmLoop() {
    const int period_us = 10000; // 10 ms period = 100 Hz PWM frequency
    while(running.load()) {
        int currentDuty = duty.load();
        int on_time = (currentDuty * period_us) / 255;

        gpiod_line_set_value(pwm_line, 1);
        std::this_thread::sleep_for(std::chrono::microseconds(on_time));

        gpiod_line_set_value(pwm_line, 0);
        std::this_thread::sleep_for(std::chrono::microseconds(period_us - on_time));
    }
}
