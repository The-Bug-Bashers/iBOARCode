#!/bin/bash

# Define colors for output
BLUE='\033[1;34m'
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color


echo -e "${BLUE}Stopping iBOAR systems...${NC}"

echo -e "${BLUE}Stopping REST API...${NC}"
screen -S API -X stuff "^C"
echo -e "${BLUE}Waiting for REST API to stop...${NC}"
sleep 4

# Check if the screen session is still running (using sudo to check root's screen sessions)
if sudo screen -list | grep -q "API"; then
      echo -e "${RED}REST API still running.${NC}"
      exit 1
else
    echo -e "${GREEN}REST API stopped successfully.${NC}"
fi


echo -e "${BLUE}Stopping MQTT broker (mosquitto)...${NC}"
sudo systemctl stop mosquitto
echo -e "${BLUE}Waiting for MQTT broker to Stop...${NC}"
sleep 1

echo -e "${GREEN}Stopped iBOAR systems successfully!${NC}"
