#include "SHT30Sensor.h"
#include "esp_log.h"
#include <math.h>

static const char* TAG = "SHT30Sensor";

SHT30Sensor::SHT30Sensor(I2CMaster& bus, uint8_t addr)
    : _bus(bus), _addr(addr) {}

SHT30SensorReading SHT30Sensor::read()
{
    // send measurement command
    uint8_t cmd[2] = {0x2C, 0x06};
    esp_err_t err;
    err = _bus.write(_addr, cmd, sizeof(cmd));
    if (err != ESP_OK)
    {
        ESP_LOGE(TAG, "I2C read failed: %s", esp_err_to_name(err));
        return fallback();
    }

    // wait 20 ms
    vTaskDelay(pdMS_TO_TICKS(20));

    // request 6 bytes from SHT30
    // - Temperature MSB
    // - Temperature LSB
    // - CRC
    // - Humidity MSB
    // - Humidity LSB
    // - CRC
    uint8_t data[6];
    if (_bus.read(_addr, data, sizeof(data)) != ESP_OK)
    {
        return fallback();
    }

    uint16_t raw_temp = (data[0] << 8) | data[1];
    uint16_t raw_hum  = (data[3] << 8) | data[4];

    // convert raw values to physical values
    float temperature = -45.0f + 175.0f * ((float)raw_temp / 65535.0f);
    float humidity = 100.0f * ((float)raw_hum / 65535.0f);

    SHT30SensorReading sensor_reading;
    sensor_reading.temperature = roundf(temperature * 10.0f) / 10.0f;
    sensor_reading.humidity    = (int) roundf(humidity);

    ESP_LOGI(TAG, "Read -> Temp=%.1f Hum=%d", sensor_reading.temperature, sensor_reading.humidity);

    return sensor_reading;
}

SHT30SensorReading SHT30Sensor::fallback()
{
    SHT30SensorReading sensor_reading;
    sensor_reading.temperature = 21.0f;
    sensor_reading.humidity    = 50;
    
    return sensor_reading;
}