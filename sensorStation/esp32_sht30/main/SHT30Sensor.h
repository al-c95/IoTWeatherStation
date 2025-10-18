#pragma once
#include "I2CSensor.h"
#include "I2CMaster.h"

class SHT30Sensor : public I2CSensor
{
    public:
        SHT30Sensor(I2CMaster& bus, uint8_t addr = 0x44)
            : I2CSensor(bus, addr) {}
            
        std::unique_ptr<SensorReading> read() override;
        
        const char* name() const override
        {
            return "SHT30";
        }

    private:
        std::unique_ptr<SensorReading> fallback();
};