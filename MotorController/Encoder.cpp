#include "Encoder.h"
#include <iostream>
#include <cmath>

constexpr int CPR = 64; // Counts per revolution of motor shaft
constexpr double GEAR_RATIO = 18.75;
constexpr int COUNTS_PER_WHEEL_ROTATION = CPR * GEAR_RATIO; // 1200 counts per full wheel rotation

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
    running = false;
    if (encoderThread.joinable()) {
        encoderThread.join();
    }

    gpiod_line_release(lineA);
    gpiod_line_release(lineB);
}

void Encoder::countPulses() {
    int lastStateA = gpiod_line_get_value(lineA);

    while (running) {
        int currentStateA = gpiod_line_get_value(lineA);
        if (currentStateA != lastStateA) {
            pulseCount++;
        }
        lastStateA = currentStateA;
        std::this_thread::sleep_for(std::chrono::microseconds(100)); // Debounce
    }
}

double Encoder::getSpeed() {
    int pulses = pulseCount.exchange(0); // Reset counter after reading
    double rotations = static_cast<double>(pulses) / COUNTS_PER_WHEEL_ROTATION;
    return rotations * 60.0; // Convert to RPM
}
