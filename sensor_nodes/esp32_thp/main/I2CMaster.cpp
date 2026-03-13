#include "I2CMaster.h"
#include "esp_err.h"

I2CMaster::I2CMaster(i2c_port_t port,
                     gpio_num_t sda,
                     gpio_num_t scl,
                     uint32_t freq_hz,
                     bool pullups)
    : _port(port)
{
    i2c_config_t conf = {};
    conf.mode = I2C_MODE_MASTER;
    conf.sda_io_num = sda;
    conf.scl_io_num = scl;
    conf.sda_pullup_en = pullups ? GPIO_PULLUP_ENABLE : GPIO_PULLUP_DISABLE;
    conf.scl_pullup_en = pullups ? GPIO_PULLUP_ENABLE : GPIO_PULLUP_DISABLE;
    conf.master.clk_speed = freq_hz;

    i2c_param_config(_port, &conf);
    i2c_driver_install(_port, conf.mode, 0, 0, 0);
}

I2CMaster::~I2CMaster()
{
    i2c_driver_delete(_port);
}

esp_err_t I2CMaster::write(uint8_t addr, const uint8_t* data, size_t len)
{
    return i2c_master_write_to_device(_port, addr, data, len,
                                      100 / portTICK_PERIOD_MS);
}

esp_err_t I2CMaster::read(uint8_t addr, uint8_t* data, size_t len)
{
    return i2c_master_read_from_device(_port, addr, data, len,
                                       100 / portTICK_PERIOD_MS);
}