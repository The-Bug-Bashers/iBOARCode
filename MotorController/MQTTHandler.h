#ifndef MQTTHANDLER_H
#define MQTTHANDLER_H

#include <mosquitto.h>

void onMessage(struct mosquitto *mosq, void *obj, const struct mosquitto_message *message);
void publishMotorData(struct mosquitto *mosq);

#endif
