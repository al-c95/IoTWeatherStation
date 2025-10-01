#pragma once
#include <memory>
#include "SensorReading.h"

class ISensor
{
    public:
        virtual ~ISensor() = default;
        virtual std::unique_ptr<SensorReading> read() = 0;
};