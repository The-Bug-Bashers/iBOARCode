cmake_minimum_required(VERSION 3.30)
project(MotorController)

set(CMAKE_CXX_STANDARD 17)

find_package(Threads REQUIRED)

add_executable(MotorController main.cpp
        MotorController.h
        MotorController.cpp
        PID.cpp
        PID.h
        MotorControl.cpp
        MotorControl.h
        MQTTHandler.cpp
        MQTTHandler.h
)

target_link_libraries(MotorController
        pthread
        mosquitto
        pigpio
)