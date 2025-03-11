#!/bin/bash

# Define colors for output
BLUE='\033[1;34m'
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Store the current user
CURRENT_USER=$(whoami)

echo -e "${BLUE}Starting iBOAR systems...${NC}"

echo -e "${BLUE}Starting MQTT broker (mosquitto)...${NC}"
sudo systemctl start mosquitto
echo -e "${BLUE}Waiting for MQTT broker to start...${NC}"
sleep 3


echo -e "${BLUE}Starting REST API (Java Maven Spring Boot)...${NC}"
cd api || { echo -e "${RED}Failed to enter 'api' directory${NC}"; exit 1; }

# Start Spring Boot in a detached screen session
sudo screen -dmS springBoot mvn spring-boot:run

echo -e "${BLUE}Waiting for REST API to start...${NC}"
sleep 12

# Check if the screen session is still running (using sudo to check root's screen sessions)
if sudo screen -list | grep -q "springBoot"; then
    echo -e "${GREEN}REST API started successfully.${NC}"
else
    echo -e "${RED}REST API terminated.${NC}"
    exit 1
fi

echo -e "${BLUE}Installing motorController dependencies...${NC}"
echo -e "${BLUE}Installing pigpio...${NC}"
sudo apt install -y pigpio

echo -e "${BLUE}Installing mosquitto for c++...${NC}"
sudo apt install -y libmosquitto-dev mosquitto-clients




echo -e "${GREEN}Started iBOAR systems successfully!${NC}"
