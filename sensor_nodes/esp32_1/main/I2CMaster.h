#pragma once
#include "driver/i2c.h"

class I2CMaster
{
    public:
        I2CMaster(i2c_port_t port,
              gpio_num_t sda,
              gpio_num_t scl,
              uint32_t freq_hz = 100000,
              bool pullups = true);
        ~I2CMaster();
        esp_err_t write(uint8_t addr, const uint8_t* data, size_t len);
        esp_err_t read(uint8_t addr, uint8_t* data, size_t len);

    private:
        i2c_port_t _port;
};