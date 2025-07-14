# iBOARCode

An improved **Basic Obstacle Avoidance Robot**
> [!NOTE]
> This repo contins the code for iBOAR, if you are searching for CAD files or circuit diagramms, have a look at the [iBOARAssets](https://github.com/The-Bug-Bashers/iBOARAssets) Repo.


---

## What is iBOAR?

**iBOAR** (Improved Basic Obstacle Avoidance Robot) is my personal learning project.  
The goal is to build a robot that can navigate autonomously and map its environment using SLAM but **without relying on existing frameworks like ROS**.

Instead, I am implementing everything myself to fully understand:

- Designing and constructing physical robot parts
- Creating a modular software system
- Working with low-level hardware control (motors, LiDAR, encoders)
- Developing my own SLAM algorithms
- Building a distributed microservice architecture with MQTT

---

## System Architecture

- Fully modular: each component runs as an independent **service**.
- Communication is handled via **MQTT**, so services are decoupled.
- Written in a mix of **Java/Spring Boot** and **C++**.

---

## Documentation

The code in this repository is organized into multiple modules (services).  
Full setup instructions, build commands, and usage examples are provided in the **[Wiki](../../wiki)**

### Modules include:
- [MQTT Broker (Mosquitto)](../../wiki/MQTT-Broker)
- [API Service (Web UI + Command Parser)](../../wiki/API-Service)
- [Motor Controller](../../wiki/Motor-Controller)
- [LiDAR Controller](../../wiki/Lidar-Controller)
- [Navigation Service](../../wiki/Navigation-Service)

---

## CAD files and hardware documentation

If you’re interested in the robot’s hardware design, you’ll find CAD files in the [iBOARAssets](https://github.com/The-Bug-Bashers/iBOARAssets) repository.
