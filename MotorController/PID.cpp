#include "PID.h"

double computePID(PID &pid, double target, double actual) {
    double error = target - actual;
    pid.integral += error;
    double derivative = error - pid.previousError;
    pid.previousError = error;
    return (pid.kp * error) + (pid.ki * pid.integral) + (pid.kd * derivative);
}
