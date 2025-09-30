#pragma once
#include "SensorReading.h"

struct SHT30SensorReading : SensorReading
{
    float temperature;
    int humidity;

    std::map<std::string, SensorValue> get_values() const override
    {
        return
        {
            {"temperature", temperature},
            {"humidity", humidity}
        };
    }
};