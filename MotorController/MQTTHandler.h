#ifndef MQTTHANDLER_H
#define MQTTHANDLER_H

#include <mosquitto.h>
#include <atomic>

void onMessage(struct mosquitto *mosq, void *obj, const struct mosquitto_message *message);
void publishMotorData(struct mosquitto *mosq);

extern std::atomic<bool> publishing;

#endif
