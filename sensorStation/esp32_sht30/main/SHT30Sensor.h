#pragma once
#include "ISensor.h"
#include "I2CMaster.h"

class SHT30Sensor : public ISensor
{
    public:
        SHT30Sensor(I2CMaster& bus, uint8_t addr = 0x44);
        std::unique_ptr<SensorReading> read() override;

    private:
        I2CMaster& _bus;
        uint8_t _addr;

        std::unique_ptr<SensorReading> fallback();
};