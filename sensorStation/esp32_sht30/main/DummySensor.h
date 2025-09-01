#pragma once
#include "ISensor.h"

class DummySensor : public ISensor
{
    public:
        SensorReading read() override;

    private:
        int random_int(int a, int b);
        float random_float();
        float random_float(int a, int b);
};