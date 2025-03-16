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
        if (currentA != lastA || currentB != lastB) {
            if ((lastA == 0 && currentA == 1 && lastB == currentB) ||
                (lastB == 0 && currentB == 1 && lastA == currentA)) {
                pulseCount.fetch_add(1, std::memory_order_relaxed);  // Forward
            } else {
                pulseCount.fetch_sub(1, std::memory_order_relaxed);  // Backward
            }
        }

        lastA = currentA;
        lastB = currentB;
        std::this_thread::sleep_for(std::chrono::microseconds(10)); // Debounce (improper but working)
    }
}

double Encoder::getSpeed() {
    auto currentTime = std::chrono::steady_clock::now();
    double elapsedSeconds = std::chrono::duration<double>(currentTime - lastTime).count();

    int pulses = pulseCount.exchange(0, std::memory_order_relaxed);
    double rotations = static_cast<double>(pulses) / COUNTS_PER_WHEEL_ROTATION;
    double rpm = (rotations / elapsedSeconds) * 60.0;

    lastTime = currentTime;  // Update timestamp AFTER calculation

    std::cout << "[ENCODER] Elapsed Time: " << elapsedSeconds << " sec, Pulses: "
              << pulses << ", Rotations: " << rotations << ", RPM: " << rpm << std::endl;

    return rpm;
}
