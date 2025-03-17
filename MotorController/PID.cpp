#include "PID.h"

double computePID(PID &pid, double target, double actual) {
    double error = target - actual;
    pid.integral += error;
    double derivative = error - pid.previousError;
    pid.previousError = error;
    double pidValue = (pid.kp * error) + (pid.ki * pid.integral) + (pid.kd * derivative);
    if (pidValue > 255.0) {
        pidValue = 255.0;
    } else if (pidValue < -255) {
        pidValue = -255.0;
    }
    return pidValue;
}
