# iBOARCode
This repository provides the code for iBOAR (a improved Basic Obstacle Avoidance Robot with SLAM capabilities).
> [!NOTE]
> CAD files and earlyer verisons of the code + robot can be found in the [BOAR repository](https://github.com/The-Bug-Bashers/BOAR)

# Modules
iBOAR is based on different modules, which comunicate with each other over MQTT (Message Queue Telemetry Transport)
## MQTT Broker (mosquitto)
Mosquitto is the central server that handles all messages between the modules.
### Basic information
- Each module acts as a client.
  - Clients
    - Clients can publish messages or subscribe to toppics
  - Topic
    - Topics are like a communication channel, they can be subscribed to, to receive all messages in this channel (a bit like websockets)

#### QoS (Quality of Service) Levels
there are 3 Qos levels with which messages can be send:

- 1 (Fire and forget): no receive confirmation
  - This is potimal if messages need to get send and received fast, but it does not matter, if a message is not received (for example the remote controll mode of the web interface uses this mode)
- 2 (Delivered at least once): messages can get delivered multiple times
  - I (me: @Flottegurke) am not shure which usecase this could have (maybe data, like lidarData or motor currentMotorSpeeds?)
- 3 (Guaranteed exactly once): slowest but safest
  - Greate for commands in general, like startAutonomusMaping or startLidarScan

### Basic commands
#### Installing: `sudo apt install mosquitto mosquitto-clients`

#### Broker
##### Start Broker: `sudo systemctl start mosquitto`

##### Stop Broker: `sudo systemctl stop mosquitto`

#### Debugging
##### Subscribe to a Topic: `mosquitto_sub -h localhost -t "example/toppic"`

##### Publish a Message: `mosquitto_pub -h localhost -t "example/toppic" -m "This is a test example message!"`
