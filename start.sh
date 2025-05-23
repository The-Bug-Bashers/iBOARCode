#!/bin/bash

# Define colors for output
BLUE='\033[1;34m'
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color


echo -e "${BLUE}Starting iBOAR systems...${NC}"

echo -e "${BLUE}Starting MQTT broker (mosquitto)...${NC}"
sudo systemctl start mosquitto

echo -e "${BLUE}Waiting for MQTT broker to start (be active)${NC}"
brokerTimeout=10
brokerElapsed=0
while ! systemctl is-active --quiet mosquitto; do
    sleep 1
    ((brokerElapsed++))
    if [[ $brokerElapsed -ge $brokerTimeout ]]; then
        echo -e "${RED}Failed to start MQTT broker within $brokerTimeout seconds.${NC}"
        exit 1
    fi
done
echo -e "${GREEN}MQTT broker started successfully (is active)!${NC}"


echo -e "${BLUE}Starting Motor Controller (C++)...${NC}"
cd MotorController || { echo -e "${RED}Failed to enter 'MotorController' directory${NC}"; exit 1; }
sudo screen -dmS MotorController ./MotorController # Start MotorController in a detached screen session

echo -e "${BLUE}Waiting for Motor Controller to start (not terminate)${NC}"
sleep 2
if sudo screen -list | grep -q "MotorController"; then
    echo -e "${GREEN}Motor Controller started successfully (not terminated)!${NC}"
else
    echo -e "${RED}Motor Controller terminated.${NC}"
    exit 1
fi

echo -e "${BLUE}Starting LiDAR Controller (C++)...${NC}"
cd ../LidarController || { echo -e "${RED}Failed to enter 'LidarController' directory${NC}"; exit 1; }
sudo screen -dmS LidarController ./output/Linux/Release/LidarController # Start LidarController in a detached screen session

echo -e "${BLUE}Waiting for LiDAR Controller to start (not terminate)${NC}"
sleep 1
if sudo screen -list | grep -q "LidarController"; then
    echo -e "${GREEN}LiDAR Controller started successfully (not terminated)!${NC}"
else
    echo -e "${RED}LiDAR Controller terminated.${NC}"
    exit 1
fi

echo -e "${BLUE}Starting Navigation Service (Java Maven Spring Boot)...${NC}"
cd ../NavigationService || { echo -e "${RED}Failed to enter 'NavigationService' directory${NC}"; exit 1; }
sudo screen -dmS NavigationService mvn spring-boot:run # Start NavigationService in a detached screen session

echo -e "${BLUE}Waiting for Navigation Service to start (not terminate)${NC}"
sleep 8
if sudo screen -list | grep -q "NavigationService"; then
    echo -e "${GREEN}Navigation Service started successfully (not terminated)!${NC}"
else
    echo -e "${RED}Navigation Service terminated.${NC}"
    exit 1
fi

echo -e "${BLUE}Starting API (Java Maven Spring Boot)...${NC}"
cd ../api || { echo -e "${RED}Failed to enter 'api' directory${NC}"; exit 1; }
sudo screen -dmS API mvn spring-boot:run # Start Spring Boot in a detached screen session

echo -e "${BLUE}Waiting for API to start (return header)${NC}"
apiTimeout=20
apiElapsed=0
while ! curl -s http://localhost:8080 | grep -q '<title>iBOAR Control Panel</title>'; do
    sleep 2
    ((apiElapsed+=2))
    if [[ $apiElapsed -ge $apiTimeout ]]; then
        echo -e "${RED}Failed to start API within $apiTimeout seconds.${NC}"
        exit 1
    fi
done
echo -e "${GREEN}API started successfully (returned header)!${NC}"

echo -e "${GREEN}Started iBOAR systems successfully!${NC}"
