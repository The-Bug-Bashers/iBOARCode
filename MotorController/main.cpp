#include <iostream>
#include <thread>
#include <atomic>
#include <chrono>
#include <cmath>
#include <cstring>
#include <algorithm>
#include <mosquitto.h>
#include <gpiod.h>
#include <nlohmann/json.hpp>

// ----- Motor Controller Class using libgpiod ----- //
class MotorController {
public:
    // chip: pointer to the already opened gpio chip
    // pwm_offset, forward_offset, backward_offset: BCM GPIO numbers
    MotorController(struct gpiod_chip *chip, int pwm_offset, int forward_offset, int backward_offset)
    : duty(0), running(true)
    {
        // Get lines from chip
        pwm_line = gpiod_chip_get_line(chip, pwm_offset);
        forward_line = gpiod_chip_get_line(chip, forward_offset);
        backward_line = gpiod_chip_get_line(chip, backward_offset);

        // Request output for each line
        if(gpiod_line_request_output(pwm_line, "MotorController", 0) < 0 ||
           gpiod_line_request_output(forward_line, "MotorController", 0) < 0 ||
           gpiod_line_request_output(backward_line, "MotorController", 0) < 0) {
            std::cerr << "Failed to request GPIO lines." << std::endl;
            exit(1);
        }

        // Start the software PWM thread
        pwm_thread = std::thread(&MotorController::pwmLoop, this);
    }

    ~MotorController(){
        running = false;
        if(pwm_thread.joinable())
            pwm_thread.join();

        gpiod_line_release(pwm_line);
        gpiod_line_release(forward_line);
        gpiod_line_release(backward_line);
    }

    // Set motor speed: positive => forward, negative => backward.
    // Speed is expected in a range where the absolute value maps to a duty cycle (0-255).
    void setSpeed(double speed) {
        int newDuty = std::min(255, std::max(0, static_cast<int>(std::fabs(speed))));
        duty.store(newDuty);

        if (speed > 0) {
            gpiod_line_set_value(forward_line, 1);
            gpiod_line_set_value(backward_line, 0);
        } else if (speed < 0) {
            gpiod_line_set_value(forward_line, 0);
            gpiod_line_set_value(backward_line, 1);
        } else {
            gpiod_line_set_value(forward_line, 0);
            gpiod_line_set_value(backward_line, 0);
        }
    }

    // Logging function: outputs the intended duty and current values of direction pins.
    void logPinStates(const std::string &motorName) {
        // Note: PWM line state may be rapidly toggling due to the PWM thread.
        // We log the intended duty cycle instead.
        int forwardState = gpiod_line_get_value(forward_line);
        int backwardState = gpiod_line_get_value(backward_line);
        std::cout << motorName << " -> Intended Duty: " << duty.load()
                  << ", Forward: " << forwardState
                  << ", Backward: " << backwardState << std::endl;
    }

private:
    // Simple software PWM loop
    void pwmLoop() {
        const int period_us = 10000; // 10 ms period = 100 Hz PWM frequency
        while(running.load()) {
            int currentDuty = duty.load();
            int on_time = (currentDuty * period_us) / 255;

            // Turn PWM high
            gpiod_line_set_value(pwm_line, 1);
            std::this_thread::sleep_for(std::chrono::microseconds(on_time));

            // Turn PWM low
            gpiod_line_set_value(pwm_line, 0);
            std::this_thread::sleep_for(std::chrono::microseconds(period_us - on_time));
        }
    }

    std::atomic<int> duty;
    std::atomic<bool> running;
    std::thread pwm_thread;
    struct gpiod_line *pwm_line;
    struct gpiod_line *forward_line;
    struct gpiod_line *backward_line;
};

// ----- PID Controller (Placeholder) ----- //
struct PID {
    double kp, ki, kd;
    double integral, previousError;
};

double computePID(PID &pid, double target, double actual) {
    double error = target - actual;
    pid.integral += error;
    double derivative = error - pid.previousError;
    pid.previousError = error;
    return (pid.kp * error) + (pid.ki * pid.integral) + (pid.kd * derivative);
}

// ----- Kinematics for Kiwi Drive ----- //
// Converts desired velocities (vx, vy, omega) to individual motor speeds.
void calculateMotorSpeeds(double vx, double vy, double omega, double &m1, double &m2, double &m3) {
    m1 = vx - omega;
    m2 = (-0.5 * vx + (std::sqrt(3) / 2.0) * vy - omega);
    m3 = (-0.5 * vx - (std::sqrt(3) / 2.0) * vy - omega);
}

// ----- Global Variables ----- //
struct gpiod_chip *chip;
MotorController *motor1Controller = nullptr;
MotorController *motor2Controller = nullptr;
MotorController *motor3Controller = nullptr;

// MQTT message callback
// Expected payload format (as text): "vx vy omega"
void onMessage(struct mosquitto *mosq, void *obj, const struct mosquitto_message *message) {
    if (message->payloadlen > 0) {
        try {
            // Parse JSON
            auto jsonPayload = nlohmann::json::parse((char *)message->payload);

            // Ensure correct structure
            if (!jsonPayload.contains("command") || !jsonPayload.contains("angle") || !jsonPayload.contains("speed")) {
                std::cerr << "Invalid JSON format: missing required fields." << std::endl;
                return;
            }

            std::string command = jsonPayload["command"];
            if (command != "drive") {
                return; // Ignore non-drive commands
            }

            double angle = jsonPayload["angle"];
            double speed = jsonPayload["speed"];

            // Convert (angle, speed) to (vx, vy)
            double radians = angle * M_PI / 180.0;
            double vx = speed * cos(radians);
            double vy = speed * sin(radians);

            // Calculate motor speeds
            double m1, m2, m3;
            calculateMotorSpeeds(vx, vy, 0, m1, m2, m3);

            // Set motor speeds
            motor1Controller->setSpeed(m1);
            motor2Controller->setSpeed(m2);
            motor3Controller->setSpeed(m3);

            // Logging
            std::cout << "Received command: drive, angle=" << angle << ", speed=" << speed << std::endl;
            std::cout << "Converted to: vx=" << vx << ", vy=" << vy << std::endl;
            motor1Controller->logPinStates("Motor 1");
            motor2Controller->logPinStates("Motor 2");
            motor3Controller->logPinStates("Motor 3");

        } catch (const std::exception &e) {
            std::cerr << "JSON parsing error: " << e.what() << std::endl;
        }
    }
}

int main() {
    // Open GPIO chip (usually gpiochip0)
    chip = gpiod_chip_open_by_name("gpiochip0");
    if (!chip) {
        std::cerr << "Failed to open gpiochip0." << std::endl;
        return 1;
    }

    // Create MotorController objects with BCM pin numbers
    // Motor 1: PWM=4, Forward=27, Backward=22
    // Motor 2: PWM=12, Forward=8, Backward=25
    // Motor 3: PWM=26, Forward=19, Backward=13
    motor1Controller = new MotorController(chip, 4, 27, 22);
    motor2Controller = new MotorController(chip, 12, 8, 25);
    motor3Controller = new MotorController(chip, 26, 19, 13);

    // Initialize Mosquitto library
    mosquitto_lib_init();
    struct mosquitto *mosq = mosquitto_new("MotorController", true, NULL);
    if (!mosq) {
        std::cerr << "Error: Could not create Mosquitto instance." << std::endl;
        return 1;
    }

    // Connect to the MQTT broker on localhost
    int ret = mosquitto_connect(mosq, "localhost", 1883, 60);
    if (ret != MOSQ_ERR_SUCCESS) {
        std::cerr << "MQTT connection error: " << mosquitto_strerror(ret) << std::endl;
        mosquitto_destroy(mosq);
        return 1;
    }

    mosquitto_message_callback_set(mosq, onMessage);
    mosquitto_subscribe(mosq, NULL, "boar/motor/drive", 0);

    std::thread loggingThread([](){
        while(true) {
            motor1Controller->logPinStates("Motor 1");
            motor2Controller->logPinStates("Motor 2");
            motor3Controller->logPinStates("Motor 3");
            std::this_thread::sleep_for(std::chrono::seconds(2)); // log every 2 seconds
        }
    });

    // Start MQTT loop (blocking call)
    ret = mosquitto_loop_forever(mosq, -1, 1);
    if (ret != MOSQ_ERR_SUCCESS) {
        std::cerr << "MQTT loop error: " << mosquitto_strerror(ret) << std::endl;
    }

    // Clean up (unreachable unless MQTT loop exits (fails))
    mosquitto_destroy(mosq);
    mosquitto_lib_cleanup();
    delete motor1Controller;
    delete motor2Controller;
    delete motor3Controller;
    gpiod_chip_close(chip);
    return 0;
}
