#pragma once
#include <map>
#include <string>
#include "SensorReading.h"

class ISensorDataTransmitter
{
    public:
        virtual ~ISensorDataTransmitter() = default;
        virtual bool transmit(const std::map<std::string, SensorValue>& sensor_values)=0;  
};