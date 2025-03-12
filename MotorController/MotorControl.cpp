#include "MotorControl.h"
#include <cmath>

void calculateMotorSpeeds(double vx, double vy, double omega, double &m1, double &m2, double &m3) {
    m1 = vx - omega;
    m2 = (-0.5 * vx + (std::sqrt(3) / 2.0) * vy - omega);
    m3 = (-0.5 * vx - (std::sqrt(3) / 2.0) * vy - omega);
}
