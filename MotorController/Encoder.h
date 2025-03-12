#ifndef ENCODER_H
#define ENCODER_H

#include <atomic>
#include <thread>
#include <gpiod.h>
#include <chrono>

class Encoder {
public:
    Encoder(struct gpiod_chip *chip, int pinA, int pinB);
    ~Encoder();
    double getSpeed(); // Returns speed in RPM

private:
    void countPulses();
    std::atomic<int> pulseCount;
    std::atomic<bool> running;
    std::thread encoderThread;
    struct gpiod_line *lineA;
    struct gpiod_line *lineB;
};

#endif
