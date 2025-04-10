# iBOARCode
This repository provides the code for iBOAR (an improved Basic Obstacle Avoidance Robot with SLAM capabilities).

> [!NOTE]
> CAD files and earlier versions of the code + robot can be found in the [iBOAR repository](https://github.com/The-Bug-Bashers/BOAR)



# Services
The code is based on different services, which are independend and communicate with each other over MQTT (Message Queue Telemetry Transport)


## MQTT Broker (mosquitto)
Mosquitto is the central server that handles all messages between the services.

### Basic information
- Each service acts as a client.
  - Clients
    - Clients can publish messages or subscribe to topics
  - Topic
    - Topics are like a communication channel, they can be subscribed to, to receive all messages in this channel (a bit like websockets)

#### QoS (Quality of Service) Levels
there are three Qos levels with which messages can be sent:

- 0 (Fire and forget): no receive confirmation
  - This is practical if messages need to get sent and received fast, but it does not matter if a message is not received (for example, the Lidar Controller uses this level, to publish new Lidar Data)
- 1 (Delivered at least once): messages can get delivered multiple times
  - I (@Flottegurke) am not sure which use case this could have (maybe the remote controll mode of the controll pannel could use this?)
- 2 (Guaranteed exactly once): slowest but safest
  - Great for commands in general, like startAutonomousMapping or startLidarScan
 
#### Topic structure
topics are structured like this: `toppic/subToppic/subSubToppic`

##### Wildcards
- `topic/#`: subscribes to all topics starting with the specified topic (for example, the Motor Control service subscribes to all motor topics)
- `/+/subTopic`: subscribes to all subtopics specified (for example, the api service subscribes to all data subtopics)

### Basic commands
#### Installing: `sudo apt install mosquitto mosquitto-clients`

#### Broker
##### Start Broker: `sudo systemctl start mosquitto`

##### Stop Broker: `sudo systemctl stop mosquitto`

#### Debugging
##### Subscribe to a Topic: `mosquitto_sub -h localhost -t "example/toppic"`

##### Publish a Message: `mosquitto_pub -h localhost -t "example/toppic" -m "This is a test example message!"`


## api (java, maven, spring-boot)
The api hosts the web page, parses received commands and sends them to the proper MQTT topics.

### Basic information
The api is hosted in maven, using spring-boot.

The web page is automatically hosted with the api, the code is located in the Resources/static directory.
To allow for disconnecting the SSH session that started the api, the api is run in a sudo mode screen session.

The api (and web pgae) are responsible for providing an user interface, that allows for easy controll and debugging of the robot.

###  Basic commands
##### Run: `sudo screen -S API mvn spring-boot:run`

> [!CAUTION]
> It is recommended that the API is started after the MQTT broker is already running,
> otherwise it cannot connect to the MQTT server and won't do so automatically if the broker is started. 

> [!IMPORTANT]
> It is strongly recommended to always start the screen session with the name: "API,"
> in order for utility scripts (like stop.sh) to work correctly

##### Test if API is running: `sudo screen -list | grep "API"`
This returns something like `1650.API (12/03/25 13:23:10) (Detached)` if the api is running, and nothing if it is not.

> [!WARNING]
> only works if the screen session of API was named correctly (API)

##### Stop: `sudo screen -S API -X stuff "^C"`

> [!WARNING]
> only works if the screen session of the API was named correctly (API)


## Motor Controller (C++)
The Motor Controller service controls the motors of the robot.

### Basic information
The motor controller calculates individual motor speeds based on target speed and direction,
runs a software PWM loop and makes shure, the motors are rotating ith the right speeds, using a PID (controller) loop.

This means, that other services can simply send desired headings and speeds to the motorController,
and everything else is handled by the motorController service.

The motor Controller also sends the current motor data (speeds, targets, PidValues) to the MQTT broker.

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
The Lidar Controller service controls the LiDAR sensor.

### Basic information
The Lidar Controller uses the [SLAMTEC RPLIDAR](https://www.slamtec.com/en/Lidar/A1) A1M8 to scan,
parse and relay environment data to the MQTT broker.

This is achieved by using the [RPLIDAR SDK](https://github.com/Slamtec/rplidar_sdk), 
part of which is included in this repository.

The Lidar Controller accepts commands to start and stop scanning, and while scanning frequently publishes the new LiDAR data via a MQTT Channel 

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
This returns something like `1650.LidarController (12/03/25 13:23:10) (Detached)` if the LidarController is running, and nothing if it is not.
> [!WARNING]
> only works if the screen session of the LidarController was named correctly (LidarController)


## Navigation Service (Java, Maven, Spring Boot)
The Navigation Service is responsible for autonomus navigation.
This is acceaved by calculating movement directions and speeds based on lidar data.

### Basic information
The Navigation Service Uses different algorithms to calculate the current best heading.

The autonomus navigatino can be controlled via MQTT messages, which is utilised ba the api service.

#### Currently supported modes:
##### Simple Navigate
This mode calculates the current best heading by selecting the furthes distance that is not in a restriction zone.

There are 2 modes for when the next best heading should get calculated.
the default mode calculates the next heading 2 time a second, while the other mode waits for the robot to reach the obstacle befor recalculating. 

###### Restriction Zones
**Static**
This restriction zone is always pointing 180°degrees from the target direction and is used to prevent backtracking.
> [!NOTE]
> This function prevents the robot from compleating mazes where driving away from the target (in a steep angle) is required. The width of the zone can be set to 0, but then the chances of not backtracking are slimm.

**Dnamic**
This restrictoin zone is alsways pointing 180°degrees from the current heading and prevents getting stuck in a line, because the furthest distance would, without it, always changes to the heading where the bot just came from.

###  Basic commands
##### Run: `sudo screen -S NavigationService mvn spring-boot:run`
> [!CAUTION]
> It is recommended that the Navigation Service is started after the MQTT broker is already running,
> otherwise it cannot connect to the MQTT server

> [!IMPORTANT]
> It is strongly recommended to always start the screen session with the name: "NavigationService,"
> in order for utility scripts (like stop.sh) to work correctly

##### Test if LidarController is running: `sudo screen -list | grep "NavigationService"`
This returns something like `1650.NavigationService (12/03/25 13:23:10) (Detached)` if the Navigation Service is running, and nothing if it is not.
> [!WARNING]
> only works if the screen session of the Navigation Service was named correctly (NavigationService)

##### Stop: `sudo screen -S LidarController -X stuff "^C"`
