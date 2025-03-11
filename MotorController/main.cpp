#include <iostream>
#include <cmath>
#include <pigpio>
#include <mosquitto.h>

// Motor driver pins
struct MotorPins {
    int pwm, forward, backward;
};

MotorPins motor1 = {4, 27, 22};
MotorPins motor2 = {12, 8, 25};
MotorPins motor3 = {26, 19, 13};

// Encoder pins
struct EncoderPins {
    int triggerA, triggerB;
};

EncoderPins encoder1 = {14, 15};
EncoderPins encoder2 = {11, 9};
EncoderPins encoder3 = {21, 20};

// PID Constants
struct PID {
    double kp, ki, kd;
    double integral, previousError;
};

PID pid1 = {1.0, 0.01, 0.1, 0, 0};
PID pid2 = {1.0, 0.01, 0.1, 0, 0};
PID pid3 = {1.0, 0.01, 0.1, 0, 0};

// Function to calculate PID output
double computePID(PID &pid, double target, double actual) {
    double error = target - actual;
    pid.integral += error;
    double derivative = error - pid.previousError;
    pid.previousError = error;
    return (pid.kp * error) + (pid.ki * pid.integral) + (pid.kd * derivative);
}

// Kinematics: Convert (vx, vy, omega) to motor speeds
void calculateMotorSpeeds(double vx, double vy, double omega, double &m1, double &m2, double &m3) {
    m1 = vx - omega;
    m2 = (-0.5 * vx + sqrt(3)/2 * vy - omega);
    m3 = (-0.5 * vx - sqrt(3)/2 * vy - omega);
}

// Motor control function
void setMotorSpeed(MotorPins motor, double speed) {
    int pwmValue = std::min(255, std::max(0, static_cast<int>(fabs(speed))));
    digitalWrite(motor.forward, speed > 0);
    digitalWrite(motor.backward, speed < 0);
    pwmWrite(motor.pwm, pwmValue);
}

// MQTT message callback
void onMessage(struct mosquitto *mosq, void *obj, const struct mosquitto_message *message) {
    double vx, vy, omega;
    sscanf((char *)message->payload, "%lf %lf %lf", &vx, &vy, &omega);
    double m1, m2, m3;
    calculateMotorSpeeds(vx, vy, omega, m1, m2, m3);
    setMotorSpeed(motor1, m1);
    setMotorSpeed(motor2, m2);
    setMotorSpeed(motor3, m3);
}

int main() {
    wiringPiSetupGpio();
    pinMode(motor1.pwm, PWM_OUTPUT);
    pinMode(motor1.forward, OUTPUT);
    pinMode(motor1.backward, OUTPUT);
    pinMode(motor2.pwm, PWM_OUTPUT);
    pinMode(motor2.forward, OUTPUT);
    pinMode(motor2.backward, OUTPUT);
    pinMode(motor3.pwm, PWM_OUTPUT);
    pinMode(motor3.forward, OUTPUT);
    pinMode(motor3.backward, OUTPUT);

    mosquitto_lib_init();
    struct mosquitto *mosq = mosquitto_new("kiwi_bot", true, NULL);
    mosquitto_connect(mosq, "localhost", 1883, 60);
    mosquitto_subscribe(mosq, NULL, "robot/move", 0);
    mosquitto_message_callback_set(mosq, onMessage);
    mosquitto_loop_forever(mosq, -1, 1);
    mosquitto_destroy(mosq);
    mosquitto_lib_cleanup();
    return 0;
}
