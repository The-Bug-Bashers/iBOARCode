#!/bin/bash

# Define colors for output
BLUE='\033[1;34m'
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color


echo -e "${BLUE}Stopping iBOAR systems...${NC}"

echo -e "${BLUE}Stopping API...${NC}"
sudo screen -S API -X stuff "^C"

echo -e "${BLUE}Waiting for API to stop${NC}"
apiTimeout=10
apiElapsed=0
while sudo screen -list | grep -q "API"; do
    sleep 1
    ((apiElapsed+=1))
    if [[ $apiElapsed -ge $apiTimeout ]]; then
        echo -e "${RED}Failed to stop API in $apiTimeout seconds.${NC}"
        exit 1
    fi
done
echo -e "${GREEN}Stopped API successfully!${NC}"

echo -e "${BLUE}Stopping Navigation Service...${NC}"
sudo screen -S NavigationService -X stuff "^C"

echo -e "${BLUE}Waiting for Motor Controller to stop${NC}"
NavigationServiceTimeout=10
NavigationServiceElapsed=0
while sudo screen -list | grep -q "NavigationService"; do
    sleep 1
    ((NavigationServiceElapsed+=1))
    if [[ $NavigationServiceElapsed -ge $NavigationServiceTimeout ]]; then
        echo -e "${RED}Failed to stop Navigation Service in $NavigationServiceTimeout seconds.${NC}"
        exit 1
    fi
done
echo -e "${GREEN}Stopped Navigation Service successfully!${NC}"

echo -e "${BLUE}Stopping Motor Controller...${NC}"
sudo screen -S MotorController -X stuff "^C"

echo -e "${BLUE}Waiting for Motor Controller to stop${NC}"
MotorControllerTimeout=10
MotorControllerElapsed=0
while sudo screen -list | grep -q "MotorController"; do
    sleep 1
    ((MotorControllerElapsed+=1))
    if [[ $MotorControllerElapsed -ge $MotorControllerTimeout ]]; then
        echo -e "${RED}Failed to stop Motor Controller in $MotorControllerTimeout seconds.${NC}"
        exit 1
    fi
done
echo -e "${GREEN}Stopped Motor Controller successfully!${NC}"

echo -e "${BLUE}Stopping LiDAR Controller...${NC}"
sudo screen -S LidarController -X stuff "^C"

echo -e "${BLUE}Waiting for LiDAR Controller to stop${NC}"
LidarControllerTimeout=10
LidarControllerElapsed=0
while sudo screen -list | grep -q "LidarController"; do
    sleep 1
    ((LidarControllerElapsed+=1))
    if [[ $LidarControllerElapsed -ge $LidarControllerTimeout ]]; then
        echo -e "${RED}Failed to stop Lidar Controller in $LidarControllerTimeout seconds.${NC}"
        exit 1
    fi
done
echo -e "${GREEN}Stopped Lidar Controller successfully!${NC}"

echo -e "${BLUE}Stopping MQTT broker (mosquitto)...${NC}"
sudo systemctl stop mosquitto

echo -e "${BLUE}Waiting for MQTT broker to Stop${NC}"
brokerTimeout=5
brokerElapsed=0
while systemctl is-active --quiet mosquitto; do
    sleep 1
    ((brokerElapsed+=1))
    if [[ brokerElapsed -ge $brokerTimeout ]]; then
        echo -e "${RED}Failed to stop MQTT broker in $brokerTimeout seconds.${NC}"
        exit 1
    fi
done
echo -e "${GREEN}Stopped MQTT broker successfully!${NC}"


echo -e "${GREEN}Stopped iBOAR systems successfully!${NC}"
