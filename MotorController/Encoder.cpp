#include "Encoder.h"
#include <iostream>
#include <chrono>

constexpr int COUNTS_PER_WHEEL_ROTATION = 1200; // 64 CPR * 18.75 Gear Ratio = 1200

Encoder::Encoder(struct gpiod_chip *chip, int pinA, int pinB)
    : pulseCount(0), running(true), lastTime(std::chrono::steady_clock::now()) {

    lineA = gpiod_chip_get_line(chip, pinA);
    lineB = gpiod_chip_get_line(chip, pinB);

    if (gpiod_line_request_input(lineA, "Encoder") < 0 || gpiod_line_request_input(lineB, "Encoder") < 0) {
        std::cerr << "Failed to request GPIO lines for encoder" << std::endl;
        exit(1);
    }

    lastA = gpiod_line_get_value(lineA);
    lastB = gpiod_line_get_value(lineB);

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
        int currentA = gpiod_line_get_value(lineA);
        int currentB = gpiod_line_get_value(lineB);

        // Quadrature decoding: Detect direction
        if (currentA != lastA) {
            if (currentA != currentB) {
                pulseCount.fetch_sub(1, std::memory_order_relaxed);  // Backward
            } else {
                pulseCount.fetch_add(1, std::memory_order_relaxed);  // Forward
            }
        }

        lastA = currentA;
        lastB = currentB;
        std::this_thread::sleep_for(std::chrono::microseconds(30)); // Debounce
        // improper but working because MAX_RPS(8.3) * COUNTS_PER_WHEEL_ROTATION(1200) = 10600 -> 1/10600 = 0.00009433962s = 94.33962us
    }
}

double Encoder::getSpeed() {
    auto currentTime = std::chrono::steady_clock::now();
    double elapsedSeconds = std::chrono::duration<double>(currentTime - lastTime).count();

    int pulses = pulseCount.exchange(0, std::memory_order_relaxed);
    double rotations = static_cast<double>(pulses) / (COUNTS_PER_WHEEL_ROTATION / 2.0); // Divide by 2 because of only every second tic being counted
    double rpm = (rotations / elapsedSeconds) * 60.0;
    if (rpm < 0.001 && rpm > -0.001 ) {rpm = 0.0;} //TODO: Remove once all PID bugs are fixed

    lastTime = currentTime;

    return rpm;
}
