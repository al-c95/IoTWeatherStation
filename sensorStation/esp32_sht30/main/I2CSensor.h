#pragma once
#include "ISensor.h"
#include "I2CMaster.h"

class I2CSensor : public ISensor
{
    public:
        I2CSensor(I2CMaster& bus, uint8_t addr)
            : _bus(bus), _addr(addr) {}

        virtual ~I2CSensor() = default;

    protected:
        I2CMaster& bus() { return _bus; }
        uint8_t address() const { return _addr; }

        esp_err_t i2c_write(const uint8_t* data, size_t len)
        {
            return _bus.write(_addr, data, len);
        }

        esp_err_t i2c_read(uint8_t* data, size_t len)
        {
            return _bus.read(_addr, data, len);
        }

    private:
        I2CMaster& _bus;
        uint8_t _addr;
};