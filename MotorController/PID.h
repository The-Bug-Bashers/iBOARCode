#ifndef PID_H
#define PID_H

struct PID {
    double kp, ki, kd;
    double integral, previousError;
};

double computePID(PID &pid, double target, double actual);

#endif
