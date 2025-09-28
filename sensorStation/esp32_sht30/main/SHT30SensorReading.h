#pragma once
#include "SensorReading.h"

struct SHT30SensorReading : SensorReading
{
    float temperature;
    int humidity;
};