# iBOARCode
This repository provides the code for iBOAR (an improved Basic Obstacle Avoidance Robot with SLAM capabilities).
> [!NOTE]
> CAD files and earlier versions of the code + robot can be found in the [BOAR repository](https://github.com/The-Bug-Bashers/BOAR)

# Modules
iBOAR is based on different modules, which communicate with each other over MQTT (Message Queue Telemetry Transport)
## MQTT Broker (mosquitto)
Mosquitto is the central server that handles all messages between the modules.
### Basic information
- Each module acts as a client.
  - Clients
    - Clients can publish messages or subscribe to topics
  - Topic
    - Topics are like a communication channel, they can be subscribed to, to receive all messages in this channel (a bit like websockets)

#### QoS (Quality of Service) Levels
there are three Qos levels with which messages can be sent:

- 0 (Fire and forget): no receive confirmation
  - This is practical if messages need to get sent and received fast, but it does not matter if a message is not received (for example, the remote control mode of the web interface uses this mode)
- 1 (Delivered at least once): messages can get delivered multiple times
  - I (me: @Flottegurke) am not sure which use case this could have (maybe data, like lidarData or motor currentMotorSpeeds?)
- 2 (Guaranteed exactly once): slowest but safest
  - Great for commands in general, like startAutonomousMapping or startLidarScan
 
#### Topic structure
topics are structured like this: `toppic/subToppic/subSubToppic`

##### Wildcards
- `topic/#`: subscribes to all topics starting with the specified topic (for example, the motorControl module subscribes to all motor topics)
- `+/subTopic`: subscribes to all subtopics ending with the specified subtopic (for example, the RESTAPI module subscribes to all data subtopics)


### Basic commands
#### Installing: `sudo apt install mosquitto mosquitto-clients`

#### Broker
##### Start Broker: `sudo systemctl start mosquitto`

##### Stop Broker: `sudo systemctl stop mosquitto`

#### Debugging
##### Subscribe to a Topic: `mosquitto_sub -h localhost -t "example/toppic"`

##### Publish a Message: `mosquitto_pub -h localhost -t "example/toppic" -m "This is a test example message!"`


## api (java, maven, spring-boot)
The api hosts the web page, parses received commands and release them to the proper MQTT topics.

### Basic information
The api is hosted in maven, using spring-boot.

The web page is automatically hosted with the api, the code is located in the Resources/static directory.

To allow for disconnecting the SSH session that started the api, the api is run in a sudo mode screen session 

###  Basic commands
##### Run: `sudo screen -S API mvn spring-boot:run`

> [!CAUTION]
> It is recommended that the API is started after the MQTT broker is already running,
> otherwise it cannot connect to the MQTT server and won't do so automatically if the broker is started. 

> [!IMPORTANT]
> It is strongly recommended to always start the screen session with the name: "API,"
> in order for utility scripts (like stop.sh) to work correctly

##### Test if API is running: `sudo screen -list | grep "API"`
This returns something like 
`1650.API (12/03/25 13:23:10) (Detached)` if the api is running, and nothing if it is not.
> [!WARNING]
> only works if the screen session of API was named correctly (API)

##### Stop: `sudo screen -S API -X stuff "^C"`
> [!WARNING]
> only works if the screen session of the API was named correctly (API)


## Motor Controller (C++)
The Motor Controller module controls the motors of the robot.

### Basic information
The motor controller module calculates individual motor speeds based on target speed and direction,
runs a software PWM loop and runs a PID loop.

This means that other modules can send desired headings and speeds to the motorController module,
and everything else is handled by the motorController module.

The module also sends the current motor data (speeds, targets, PidValues) to the MQTT broker.

###  Basic commands
##### Compile: `g++ main.cpp MotorController.cpp MotorControl.cpp Encoder.cpp MQTTHandler.cpp PID.cpp -o MotorController -lgpiod -lmosquitto -lpthread`

##### Run: `sudo screen -S MotorController ./MotorController`
> [!CAUTION]
> It is recommended that the motor controller is started after the MQTT broker is already running,
> otherwise it cannot connect to the MQTT server

> [!IMPORTANT]
> It is strongly recommended to always start the screen session with the name: "MotorController,"
> in order for utility scripts (like stop.sh) to work correctly

##### Test if MotorController is running: `sudo screen -list | grep "MotorController"`
This returns something like
`1650.MotorController (12/03/25 13:23:10) (Detached)` if the MotorController is running, and nothing if it is not.
> [!WARNING]
> only works if the screen session of the MotorController was named correctly (MotorController)

##### Stop: `sudo screen -S MotorController -X stuff "^C"`
> [!WARNING]
> only works if the screen session of the MotorController was named correctly (MotorController)


## Lidar Controller (C++)
The Lidar Controller module controls the LiDAR sensor.

### Basic information
The Lidar Controller module uses the [SLAMTEC RPLIDAR](https://www.slamtec.com/en/Lidar/A1) A1M8 to scan,
parse and relay environment data to the MQTT broker.

This is achieved by using the [RPLIDAR SDK](https://github.com/Slamtec/rplidar_sdk), 
part of which is included in this repository.

The module accepts commands to start and stop scanning.

###  Basic commands
##### Compile: `make build_app`

##### Run: `sudo screen -S LidarController ./output/Linux/Release/LidarController`
> [!CAUTION]
> It is recommended that the LiDAR controller is started after the MQTT broker is already running,
> otherwise it cannot connect to the MQTT server

> [!IMPORTANT]
> It is strongly recommended to always start the screen session with the name: "LidarController,"
> in order for utility scripts (like stop.sh) to work correctly

##### Test if LidarController is running: `sudo screen -list | grep "LidarController"`
This returns something like
`1650.LidarController (12/03/25 13:23:10) (Detached)` if the LidarController is running, and nothing if it is not.
> [!WARNING]
> only works if the screen session of the LidarController was named correctly (LidarController)

##### Stop: `sudo screen -S LidarController -X stuff "^C"`
> [!WARNING]
> only works if the screen session of the LidarController was named correctly (LidarController)
