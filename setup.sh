#!/bin/bash

BLUE='\033[1;34m'
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${BLUE}please note, this setup script is for ubuntu 20.04 and not guaranteed to work on other versions of ubuntu or other linux distributions.${NC}"

read -p "Do you want to continue? (y/n): " choice
case "$choice" in
  y|Y ) echo -e "${BLUE}Proceeding with the setup...${NC}";;
  n|N ) echo -e "${RED}Setup aborted.${NC}"; exit 1;;
  * ) echo -e "${RED}Invalid input. Setup aborted.${NC}"; exit 1;;
esac

read -p "Do you want to update the system? (y/n): " update_choice
case "$update_choice" in
  y|Y )
    echo -e "${BLUE}Updating the system...${NC}"
    sudo apt update
    echo -e "${BLUE}Installing updates...${NC}"
    sudo apt upgrade -y
    ;;
  n|N ) echo -e "${BLUE}Skipping system update.${NC}";;
  * ) echo -e "${RED}Invalid input. exiting setup.${NC}"; exit 1;;
esac

echo -e "${BLUE}Installing mosquito (MQTT broker)...${NC}"
sudo apt install -y mosquitto mosquitto-clients

read -p "Python 3 is used in test scripts, do you want to install it? (y/n): " python_choice
case "$python_choice" in
  y|Y )
    echo -e "${BLUE}Installing Python 3...${NC}"
    sudo apt install -y python3 python3-pip
    ;;
  n|N ) echo -e "${BLUE}Skipping Python 3 installation.${NC}";;
  * ) echo -e "${RED}Invalid input. exiting setup.${NC}"; exit 1;;
esac

echo -e "${BLUE}Installing RESTAPI dependencies...${NC}"

echo -e "${BLUE}Installing Java 17...${NC}"
sudo apt install -y openjdk-17-jdk

echo -e "${BLUE}Installing Maven...${NC}"
sudo apt install -y maven

echo -e "${BLUE}Installing Maven dependencies...${NC}"
echo -e "${BLUE}Installing API Maven dependencies...${NC}"
(cd api && sudo mvn clean install)

echo -e "${BLUE}Installing Navigation Service Maven dependencies...${NC}"
(cd NavigationService && sudo mvn clean install)

echo -e "${BLUE}Installing screen...${NC}"
sudo apt install -y screen

echo -e "${BLUE}Installing MotorController dependencies...${NC}"
echo -e "${BLUE}Installing libgpiod...${NC}"
sudo apt-get install -y libgpiod-dev

echo -e "${BLUE}Installing nlohmann-json...${NC}"
sudo apt install -y nlohmann-json3-dev


echo -e "${BLUE}Installing mosquitto for c++...${NC}"
sudo apt install -y libmosquitto-dev

echo -e "${BLUE}Installing LidarController dependencies...${NC}"
echo -e "${BLUE}Installing libjsoncpp...${NC}"
sudo apt install libjsoncpp-dev -y


read -p "Do you want the Raspberry to automatically connect to a hotspot on boot (using nmcli)? (y/n): " choice
case "$choice" in
  y|Y )
    echo -e "${BLUE}Installing nmcli...${NC}"
    sudo apt install -y network-manager
    echo -e "${BLUE}Setting up automatic  connectivity...${NC}"
    sudo systemctl start NetworkManager
    sleep 2
    sudo nmcli device wifi connect "iBoarAccessPoint" password "boarBoar"
    sleep 1
    sudo systemctl enable NetworkManager
    echo -e "${GREEN}The Raspberry will automatically connect to:\nSSID: iBoarAccessPoint\nPassword: boarBoar\nNetwork band: 2.4GHZ${NC}"
  ;;

  n|N ) echo -e "${BLUE}Skipping automatic hotspot connectivity.${NC}";;
  * ) echo -e "${RED}Invalid input. Setup aborted.${NC}"; exit 1;;
esac


SCRIPT_DIR="$(pwd)"
SHELL_RC="$HOME/.bashrc"

echo -e "${BLUE}Adding start and stop aliases to $SHELL_RC...${NC}"

# Avoid duplicate entries by first removing any existing lines
sed -i '/alias start=/d' "$SHELL_RC"
sed -i '/alias stop=/d' "$SHELL_RC"

# Append new aliases
echo "alias start='$SCRIPT_DIR/start.sh'" >> "$SHELL_RC"
echo "alias stop='$SCRIPT_DIR/stop.sh'" >> "$SHELL_RC"

echo -e "${GREEN}Aliases added successfully.${NC}"



echo -e "${GREEN}Setup complete.${NC}"
