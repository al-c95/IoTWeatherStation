#pragma once
#include "SHT30SensorReading.h"

class ISensor
{
    public:
        virtual ~ISensor() = default;
        virtual SHT30SensorReading read() = 0;
};