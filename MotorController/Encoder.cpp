#include "Encoder.h"
#include <iostream>
#include <chrono>

constexpr int COUNTS_PER_WHEEL_ROTATION = 1200; // CPR * GEAR_RATIO -> 64 * 18.75 -> 1200

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
    int lastA = gpiod_line_get_value(lineA);
    int lastB = gpiod_line_get_value(lineB);

    while (running.load(std::memory_order_relaxed)) {
        int currentA = gpiod_line_get_value(lineA);
        int currentB = gpiod_line_get_value(lineB);

        if (currentA != lastA) { // A signal changed
            if (currentA == currentB) {
                pulseCount.fetch_add(1, std::memory_order_relaxed);  // Forward
            } else {
                pulseCount.fetch_sub(1, std::memory_order_relaxed);  // Backward
            }
        }

        lastA = currentA;
        lastB = currentB;
        std::this_thread::sleep_for(std::chrono::microseconds(50)); // Debounce
    }
}

double Encoder::getSpeed() {
    static auto lastTime = std::chrono::steady_clock::now();
    auto currentTime = std::chrono::steady_clock::now();
    double elapsedSeconds = std::chrono::duration<double>(currentTime - lastTime).count();
    lastTime = currentTime;


    int pulses = pulseCount.exchange(0, std::memory_order_relaxed);
    double rotations = static_cast<double>(pulses) / COUNTS_PER_WHEEL_ROTATION;
    return (rotations / elapsedSeconds) * 60.0; // Convert to RPM
}