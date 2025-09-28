#pragma once
#include "SHT30SensorReading.h"

class ISensorDataTransmitter
{
    public:
        virtual ~ISensorDataTransmitter() = default;
        virtual bool transmit(const SHT30SensorReading& sensor_reading)=0;  
};