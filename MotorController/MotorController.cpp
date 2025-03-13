#include "MotorController.h"
#include <chrono>
#include <cmath>
#include <iostream>
#include <thread>
#include "PID.h"
#include "Encoder.h"


MotorController::MotorController(struct gpiod_chip *chip, int pwm_offset, int forward_offset, int backward_offset, int encoderA, int encoderB, double kp, double ki, double kd)
: duty(0), running(true), targetSpeed(0), pid{kp, ki, kd, 0, 0} {
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
    pid_thread = std::thread(&MotorController::pidLoop, this);

}

MotorController::~MotorController(){
    running = false;
    if(pwm_thread.joinable())
        pwm_thread.join();

    delete encoder;
    gpiod_line_release(pwm_line);
    gpiod_line_release(forward_line);
    gpiod_line_release(backward_line);
    running = false;
    if (pid_thread.joinable()) pid_thread.join();

}

void MotorController::setTargetSpeed(double speed) {
    if (speed == 0) {
        pid.integral = 0;  // Reset PID integral to prevent wind-up
    }
    std::cout << "[DEBUG] Setting Target Speed: " << speed << std::endl;
    targetSpeed.store(speed);
}

void MotorController::pidLoop() {
    while (running) { std::cout << "requesting new speed: " << std::endl;
        double actualSpeed = getActualSpeed();
        double target = targetSpeed.load();
        double pidOutput = computePID(pid, target, actualSpeed);

        setSpeed(pidOutput);  // Continuously update motor speed

        std::this_thread::sleep_for(std::chrono::milliseconds(500)); // Update every 500 ms
    }
}

double MotorController::getActualSpeed() {
    return encoder->getSpeed();;
}

void MotorController::getMotorData(double &currentTargetSpeed, double &actualSpeed, double &pidOutput) {
    actualSpeed = getActualSpeed();
    currentTargetSpeed = targetSpeed.load();

    pidOutput = lastPidOutput;
}


void MotorController::setSpeed(double pidOutput) {
    int newDuty = std::min(255, std::max(0, static_cast<int>(std::fabs(pidOutput))));
    duty.store(newDuty);
    lastPidOutput = pidOutput;

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
