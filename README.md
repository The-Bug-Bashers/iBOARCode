# iBOARCode
This repository provides the code for iBOAR (an improved Basic Obstacle Avoidance Robot with SLAM capabilities).
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

- 0 (Fire and forget): no receive confirmation
  - This is potimal if messages need to get send and received fast, but it does not matter, if a message is not received (for example the remote controll mode of the web interface uses this mode)
- 1 (Delivered at least once): messages can get delivered multiple times
  - I (me: @Flottegurke) am not shure which usecase this could have (maybe data, like lidarData or motor currentMotorSpeeds?)
- 2 (Guaranteed exactly once): slowest but safest
  - Greate for commands in general, like startAutonomusMaping or startLidarScan
 
#### Topic structure
toppics are strictured like this: `toppic/subToppic/subSubToppic`

##### Wildcards
- `topic/#`: subscribes to all topics starting with the specifyed topic (for example the motorControll module subscribes to all motor topics)
- `+/subTopic`: subscribes to all sub topics ending with the specifyed sub topic (for example the RESTAPI module subscribes to all data subtopics)


### Basic commands
#### Installing: `sudo apt install mosquitto mosquitto-clients`

#### Broker
##### Start Broker: `sudo systemctl start mosquitto`

##### Stop Broker: `sudo systemctl stop mosquitto`

#### Debugging
##### Subscribe to a Topic: `mosquitto_sub -h localhost -t "example/toppic"`

##### Publish a Message: `mosquitto_pub -h localhost -t "example/toppic" -m "This is a test example message!"`


## api (java, maven, spring-boot)
The api hosts the web page, parses received commands and releys them to the propper MQTT topics.

### Basic information
The api is hosted in maven, using spring-boot.

The web page is automaticaly hosted with the api, the code is located in the Resources/static directory.

To allow for disconnecting the SSH session that started the api, the api is runn in a sudo mode screen session 

###  Basic commands
##### Start API in sudo mode screen session with name "API": `sudo screen -S API mvn spring-boot:run`
> [!TIP]
> to start the session detached add `-dm` before `-S`

> [!IMPORTANT]
> It is recomended that the API is started after the MQTT broker is alreaddy running, otherwise it can not connect to the MQTT server, and won't do so automaticaly if the broker is started. 

> [!CAUTION]
> It is strongly recoomended to always start the screen session with the name: "API", in order for utility scipts (like stop.sh) to work correctly

##### Test if API is running: `sudo screen -list | grep "API"`
This returns somthing like `1650.API        (12/03/25 13:23:10)     (Detached)` if the api is runing and nothing if it is not.
> [!WARNING]
> ownly works, if screen session of API was named correctly (API)

##### Stop API: `sudo screen -S API -X stuff "^C"`
> [!WARNING]
> ownly works, if screen session of API was named correctly (API)
