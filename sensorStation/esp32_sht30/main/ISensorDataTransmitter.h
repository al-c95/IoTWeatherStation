#pragma once
#include "SensorReading.h"

class ISensorDataTransmitter
{
    public:
        virtual ~ISensorDataTransmitter() = default;
        virtual bool transmit(const SensorReading& sensor_reading)=0;  
};