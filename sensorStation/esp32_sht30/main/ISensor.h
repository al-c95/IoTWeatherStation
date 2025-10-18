#pragma once
#include <memory>
#include "SensorReading.h"

class ISensor
{
    public:
        virtual ~ISensor() = default;
        virtual const char* name() const = 0;
        virtual std::unique_ptr<SensorReading> read() = 0;
};