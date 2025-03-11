#include <iostream>
#include <thread>
#include <atomic>
#include <chrono>
#include <cmath>
#include <cstring>
#include <algorithm>
#include <mosquitto.h>
#include <gpiod.h>

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
    double vx, vy, omega;
    if(message->payloadlen > 0) {
        if (sscanf((char *)message->payload, "%lf %lf %lf", &vx, &vy, &omega) == 3) {
            double m1, m2, m3;
            calculateMotorSpeeds(vx, vy, omega, m1, m2, m3);

            // Here you could add PID corrections using encoder feedback
            // For now we directly set motor speeds (mapped to duty cycle values)
            motor1Controller->setSpeed(m1);
            motor2Controller->setSpeed(m2);
            motor3Controller->setSpeed(m3);

            std::cout << "Received command: vx=" << vx << " vy=" << vy << " omega=" << omega << std::endl;
        } else {
            std::cerr << "Invalid payload format." << std::endl;
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
    mosquitto_subscribe(mosq, NULL, "robot/move", 0);

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
