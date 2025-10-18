#include "SHT30Sensor.h"
#include "SensorReading.h"
#include "SHT30SensorReading.h"
#include "esp_log.h"
#include <math.h>
#include <memory>

static const char* TAG = "SHT30Sensor";

static uint8_t sht30_crc8(const uint8_t *data, size_t len)
{
    // CRC-8 calculation for SHT30 data (polynomial 0x31, initial 0xFF)
    uint8_t crc = 0xFF;
    for (size_t i = 0; i < len; ++i)
    {
        crc ^= data[i];
        for (int b = 0; b < 8; ++b)
        {
            crc = (crc & 0x80) ? (crc << 1) ^ 0x31 : (crc << 1);
        }
    }

    return crc;
}

std::unique_ptr<SensorReading> SHT30Sensor::read()
{
    //ESP_LOGI("Reading SHT30...");

    const int MAX_RETRIES = 3;
    for (int attempt = 0; attempt < MAX_RETRIES; ++attempt)
    {
        // send measurement command
        uint8_t cmd[2] = {0x2C, 0x06};
        esp_err_t err;
        err = i2c_write(cmd, sizeof(cmd));
        if (err != ESP_OK)
        {
            ESP_LOGW(TAG, "I2C write failed (attempt %d): %s", attempt + 1, esp_err_to_name(err));
            // retry
            continue;
        }

        // wait 20 ms for measurement
        vTaskDelay(pdMS_TO_TICKS(20));

        // request 6 bytes from SHT30
        // - Temperature MSB
        // - Temperature LSB
        // - CRC
        // - Humidity MSB
        // - Humidity LSB
        // - CRC
        uint8_t data[6];
        err = i2c_read(data, sizeof(data));
        if (err != ESP_OK)
        {
            ESP_LOGW(TAG, "I2C write failed (attempt %d): %s", attempt + 1, esp_err_to_name(err));
            // retry
            continue;
        }

        // perform CRC checks
        if (sht30_crc8(data, 2) != data[2])
        {
            ESP_LOGW(TAG, "CRC check failed for temperature (attempt %d)", attempt + 1);
            // retry
            continue;
        }
        if (sht30_crc8(data + 3, 2) != data[5])
        {
            ESP_LOGW(TAG, "CRC check failed for humidity (attempt %d)", attempt + 1);
            // retry
            continue;
        }

        // parse raw values
        uint16_t raw_temp = (data[0] << 8) | data[1];
        uint16_t raw_hum  = (data[3] << 8) | data[4];

        // basic garbage filtering
        if (raw_temp == 0 || raw_temp == 0xFFFF || raw_hum == 0 || raw_hum == 0xFFFF)
        {
            ESP_LOGW(TAG, "Suspicious raw values (attempt %d): temp=0x%04X hum=0x%04X",
                     attempt + 1, raw_temp, raw_hum);
            // retry
            continue; 
        }

        // convert raw values to physical values
        float temperature = -45.0f + 175.0f * ((float)raw_temp / 65535.0f);
        float humidity = 100.0f * ((float)raw_hum / 65535.0f);

        auto sensor_reading = std::make_unique<SHT30SensorReading>();
        sensor_reading->temperature = roundf(temperature * 10.0f) / 10.0f;
        sensor_reading->humidity    = (int) roundf(humidity);

        ESP_LOGI(TAG, "Read OK (attempt %d) -> Temp=%.1f°C Hum=%d%%",
                 attempt + 1, sensor_reading->temperature, sensor_reading->humidity);

        return sensor_reading;
    }

    ESP_LOGE(TAG, "Failed to get valid SHT30 reading after %d attempts", MAX_RETRIES);

    return fallback();
}

std::unique_ptr<SensorReading> SHT30Sensor::fallback()
{
    auto sensor_reading = std::make_unique<SHT30SensorReading>();
    sensor_reading->temperature = 21.0f;
    sensor_reading->humidity    = 50;
    ESP_LOGW(TAG, "Returning fallback reading: Temp=%.1f°C Hum=%d%%",
             sensor_reading->temperature, sensor_reading->humidity);
    
    return sensor_reading;
}