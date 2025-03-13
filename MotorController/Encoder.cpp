#include "Encoder.h"
#include <iostream>
#include <chrono>

constexpr int CPR = 64;
constexpr double GEAR_RATIO = 18.75;
constexpr int COUNTS_PER_WHEEL_ROTATION = CPR * GEAR_RATIO;

Encoder::Encoder(struct gpiod_chip *chip, int pinA, int pinB) : pulseCount(0), running(true) {
    lineA = gpiod_chip_get_line(chip, pinA);
    lineB = gpiod_chip_get_line(chip, pinB);

    if (gpiod_line_request_input(lineA, "Encoder") < 0 || gpiod_line_request_input(lineB, "Encoder") < 0) {
        std::cerr << "Failed to request GPIO lines for encoder" << std::endl;
        exit(1);
    }

    encoderThread = std::thread(&Encoder::countPulses, this);
}

Encoder::~Encoder() {
    running.store(false, std::memory_order_relaxed);
    if (encoderThread.joinable()) {
        encoderThread.join();
    }
    gpiod_line_release(lineA);
    gpiod_line_release(lineB);
}

void Encoder::countPulses() {
    while (running.load(std::memory_order_relaxed)) {
        int stateA = gpiod_line_get_value(lineA);
        if (stateA) {
            pulseCount.fetch_add(1, std::memory_order_relaxed);
        }
        std::this_thread::sleep_for(std::chrono::milliseconds(1));
    }
}

double Encoder::getSpeed() {
    int pulses = pulseCount.exchange(0, std::memory_order_relaxed);
    return (static_cast<double>(pulses) / COUNTS_PER_WHEEL_ROTATION) * 60.0;
}