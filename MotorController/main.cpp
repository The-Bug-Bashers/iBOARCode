#include <iostream>
#include <cmath>
#include <cstdlib>
#include <pigpio.h>
#include <mosquitto.h>
#include <cstring>

// Motor driver pins structure
struct MotorPins {
    int pwm, forward, backward;
};

// Define motor pins (using BCM numbering)
MotorPins motor1 = {4, 27, 22};
MotorPins motor2 = {12, 8, 25};
MotorPins motor3 = {26, 19, 13};

// PID structure
struct PID {
    double kp, ki, kd;
    double integral, previousError;
};

PID pid1 = {1.0, 0.01, 0.1, 0, 0};
PID pid2 = {1.0, 0.01, 0.1, 0, 0};
PID pid3 = {1.0, 0.01, 0.1, 0, 0};

// Compute PID output (for future integration with encoder feedback)
double computePID(PID &pid, double target, double actual) {
    double error = target - actual;
    pid.integral += error;
    double derivative = error - pid.previousError;
    pid.previousError = error;
    return (pid.kp * error) + (pid.ki * pid.integral) + (pid.kd * derivative);
}

// Kinematics: Convert (vx, vy, omega) to motor speeds for a Kiwi drive
void calculateMotorSpeeds(double vx, double vy, double omega, double &m1, double &m2, double &m3) {
    m1 = vx - omega;
    m2 = (-0.5 * vx + (std::sqrt(3)/2.0) * vy - omega);
    m3 = (-0.5 * vx - (std::sqrt(3)/2.0) * vy - omega);
}

// Set motor speed using pigpio functions
// speed: positive for forward, negative for backward
// PWM value is scaled between 0 and 255
void setMotorSpeed(MotorPins motor, double speed) {
    int pwmValue = std::min(255, std::max(0, static_cast<int>(fabs(speed))));
    // Set motor direction
    if (speed > 0) {
        gpioWrite(motor.forward, 1);
        gpioWrite(motor.backward, 0);
    } else if (speed < 0) {
        gpioWrite(motor.forward, 0);
        gpioWrite(motor.backward, 1);
    } else {
        gpioWrite(motor.forward, 0);
        gpioWrite(motor.backward, 0);
    }
    gpioPWM(motor.pwm, pwmValue);
}

// MQTT message callback: expects payload with three doubles: vx vy omega
void onMessage(struct mosquitto *mosq, void *obj, const struct mosquitto_message *message) {
    double vx, vy, omega;
    if(message->payloadlen > 0) {
        // Expecting payload as text: \"vx vy omega\"\n
        if(sscanf((char *)message->payload, "%lf %lf %lf", &vx, &vy, &omega) == 3) {
            double m1, m2, m3;
            calculateMotorSpeeds(vx, vy, omega, m1, m2, m3);
            // Optionally: integrate PID correction using encoder feedback here
            setMotorSpeed(motor1, m1);
            setMotorSpeed(motor2, m2);
            setMotorSpeed(motor3, m3);
        } else {
            std::cerr << "Invalid payload format" << std::endl;
        }
    }
}

int main() {
    // Initialize pigpio
    if (gpioInitialise() < 0) {
        std::cerr << "pigpio initialization failed" << std::endl;
        return 1;
    }

    // Set motor pins as outputs
    int motorPins[] = {motor1.pwm, motor1.forward, motor1.backward,
                         motor2.pwm, motor2.forward, motor2.backward,
                         motor3.pwm, motor3.forward, motor3.backward};
    for (int pin : motorPins) {
        gpioSetMode(pin, PI_OUTPUT);
    }

    // Optionally, set PWM frequency for each motor's PWM pin (e.g., 800 Hz)
    gpioSetPWMfrequency(motor1.pwm, 800);
    gpioSetPWMfrequency(motor2.pwm, 800);
    gpioSetPWMfrequency(motor3.pwm, 800);

    // Initialize Mosquitto library
    mosquitto_lib_init();
    struct mosquitto *mosq = mosquitto_new("MotorController", true, NULL);
    if(!mosq) {
        std::cerr << "Error: Could not create Mosquitto instance." << std::endl;
        gpioTerminate();
        return 1;
    }

    // Connect to the MQTT broker on localhost
    int ret = mosquitto_connect(mosq, "localhost", 1883, 60);
    if(ret != MOSQ_ERR_SUCCESS) {
        std::cerr << "MQTT connection error: " << mosquitto_strerror(ret) << std::endl;
        mosquitto_destroy(mosq);
        gpioTerminate();
        return 1;
    }

    // Set the MQTT message callback and subscribe to topic\n
    mosquitto_message_callback_set(mosq, onMessage);
    mosquitto_subscribe(mosq, NULL, "robot/move", 0);

    // Main loop
    ret = mosquitto_loop_forever(mosq, -1, 1);
    if(ret != MOSQ_ERR_SUCCESS) {
        std::cerr << "MQTT loop error: " << mosquitto_strerror(ret) << std::endl;
    }

    // Clean up\n
    mosquitto_destroy(mosq);
    mosquitto_lib_cleanup();
    gpioTerminate();
    return 0;
}
