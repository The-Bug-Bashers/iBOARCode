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

class Encoder {
public:
    // Pass the already-opened chip and the two GPIO numbers.
    Encoder(struct gpiod_chip *chip, int lineA_num, int lineB_num)
        : count(0), running(true)
    {
        // Get the lines.
        lineA = gpiod_chip_get_line(chip, lineA_num);
        lineB = gpiod_chip_get_line(chip, lineB_num);
        if (!lineA || !lineB) {
            std::cerr << "Failed to get encoder lines." << std::endl;
            exit(1);
        }
        // Request events on both lines.
        if(gpiod_line_request_both_edges_events(lineA, "Encoder") < 0 ||
           gpiod_line_request_both_edges_events(lineB, "Encoder") < 0) {
            std::cerr << "Failed to request events for encoder lines." << std::endl;
            exit(1);
        }
        // Start the polling thread.
        poll_thread = std::thread(&Encoder::pollEvents, this);
    }

    ~Encoder() {
        running = false;
        if(poll_thread.joinable())
            poll_thread.join();
        gpiod_line_release(lineA);
        gpiod_line_release(lineB);
    }

    // Poll for events and update the counter.
    void pollEvents() {
        struct gpiod_line_event event;
        // Use a short timeout for the wait loop.
        struct timespec timeout = { .tv_sec = 0, .tv_nsec = 100000000 }; // 100ms
        while (running.load()) {
            // Check events on lineA.
            if (gpiod_line_event_wait(lineA, &timeout) > 0) {
                if(gpiod_line_event_read(lineA, &event) == 0)
                    count++;
            }
            // Check events on lineB.
            if (gpiod_line_event_wait(lineB, &timeout) > 0) {
                if(gpiod_line_event_read(lineB, &event) == 0)
                    count++;
            }
        }
    }

    // Returns RPM based on 1200 counts per revolution.
    double getSpeed() {
        int pulses = count.exchange(0);
        return (pulses / 1200.0) * 60.0;
    }

private:
    struct gpiod_line *lineA;
    struct gpiod_line *lineB;
    std::atomic<int> count;
    std::atomic<bool> running;
    std::thread poll_thread;
};

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

class MotorController {
public:
    MotorController(struct gpiod_chip *chip, int pwm_offset, int forward_offset, int backward_offset, Encoder *encoder)
        : duty(0), running(true), pid{0.1, 0.01, 0.05, 0, 0}, encoder(encoder) {
        pwm_line = gpiod_chip_get_line(chip, pwm_offset);
        forward_line = gpiod_chip_get_line(chip, forward_offset);
        backward_line = gpiod_chip_get_line(chip, backward_offset);

        if(gpiod_line_request_output(pwm_line, "MotorController", 0) < 0 ||
           gpiod_line_request_output(forward_line, "MotorController", 0) < 0 ||
           gpiod_line_request_output(backward_line, "MotorController", 0) < 0) {
            std::cerr << "Failed to request GPIO lines." << std::endl;
            exit(1);
        }

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

    // Set target speed (in RPM) for the PID controller
    void setSpeed(double targetSpeed) {
        this->targetSpeed = targetSpeed;
    }

private:
    void pwmLoop() {
        while(running.load()) {
            // Read actual speed from the encoder.
            double actualSpeed = encoder->getSpeed();
            // Compute PID output based on the target and actual speeds.
            double pidOutput = computePID(pid, targetSpeed, actualSpeed);

            // Set motor direction based on PID output sign.
            if (pidOutput >= 0) {
                gpiod_line_set_value(forward_line, 1);
                gpiod_line_set_value(backward_line, 0);
            } else {
                gpiod_line_set_value(forward_line, 0);
                gpiod_line_set_value(backward_line, 1);
            }

            // Compute PWM duty cycle from the magnitude of PID output.
            int newDuty = std::min(255, std::max(0, static_cast<int>(std::fabs(pidOutput))));
            duty.store(newDuty);

            // Generate PWM signal on pwm_line based on computed duty.
            gpiod_line_set_value(pwm_line, 1);
            std::this_thread::sleep_for(std::chrono::microseconds(newDuty * 10000 / 255));
            gpiod_line_set_value(pwm_line, 0);
            std::this_thread::sleep_for(std::chrono::microseconds(10000 - (newDuty * 10000 / 255)));
        }
    }

    PID pid;
    std::atomic<int> duty;
    std::atomic<bool> running;
    std::thread pwm_thread;
    struct gpiod_line *pwm_line;
    struct gpiod_line *forward_line;
    struct gpiod_line *backward_line;
    Encoder *encoder;
    std::atomic<double> targetSpeed;
};

void onMessage(struct mosquitto *mosq, void *obj, const struct mosquitto_message *message) {
    if (message->payloadlen > 0) {
        try {
            auto jsonPayload = nlohmann::json::parse((char *)message->payload);
            if (!jsonPayload.contains("command") || !jsonPayload.contains("angle") || !jsonPayload.contains("speed")) {
                std::cerr << "Invalid JSON format: missing required fields." << std::endl;
                return;
            }

            std::string command = jsonPayload["command"];
            if (command != "drive") {
                return;
            }

            double angle = jsonPayload["angle"];
            double speed = jsonPayload["speed"];
            double radians = angle * M_PI / 180.0;
            double vx = speed * sin(radians);
            double vy = speed * cos(radians);

            double m1, m2, m3;
            calculateMotorSpeeds(vx, vy, 0, m1, m2, m3);

            // Set target speeds for each motor controller.
            motor1Controller->setSpeed(m1);
            motor2Controller->setSpeed(m2);
            motor3Controller->setSpeed(m3);
        } catch (const std::exception &e) {
            std::cerr << "JSON parsing error: " << e.what() << std::endl;
        }
    }
}

int main() {
    chip = gpiod_chip_open_by_name("gpiochip0");
    if (!chip) {
        std::cerr << "Failed to open gpiochip0." << std::endl;
        return 1;
    }

    // Create encoders for each motor.
    Encoder encoder1(14, 15);
    Encoder encoder2(11, 9);
    Encoder encoder3(21, 20);

    // Instantiate motor controllers with given GPIO offsets.
    motor1Controller = new MotorController(chip, 4, 27, 22, &encoder1);
    motor2Controller = new MotorController(chip, 12, 8, 25, &encoder2);
    motor3Controller = new MotorController(chip, 26, 19, 13, &encoder3);

    mosquitto_lib_init();
    struct mosquitto *mosq = mosquitto_new("MotorController", true, NULL);
    if (!mosq) {
        std::cerr << "Error: Could not create Mosquitto instance." << std::endl;
        return 1;
    }

    int ret = mosquitto_connect(mosq, "localhost", 1883, 60);
    if (ret != MOSQ_ERR_SUCCESS) {
        std::cerr << "MQTT connection error: " << mosquitto_strerror(ret) << std::endl;
        mosquitto_destroy(mosq);
        return 1;
    }

    mosquitto_message_callback_set(mosq, onMessage);
    mosquitto_subscribe(mosq, NULL, "boar/motor/drive", 0);
    ret = mosquitto_loop_forever(mosq, -1, 1);

    mosquitto_destroy(mosq);
    mosquitto_lib_cleanup();
    delete motor1Controller;
    delete motor2Controller;
    delete motor3Controller;
    gpiod_chip_close(chip);
    return 0;
}
