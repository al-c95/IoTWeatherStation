#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"
#include "freertos/task.h"
#include "esp_log.h"
#include <math.h>
#include "SensorTask.h"

SensorTask::SensorTask(ISensor* sensor, ISensorDataTransmitter* sensor_data_transmitter)
    : _sensor(sensor), _sensor_data_transmitter(sensor_data_transmitter)
{

}

void SensorTask::start()
{
    xTaskCreate(&SensorTask::task_entry, "sensor_task", 4096, this, 5, nullptr);
}

void SensorTask::task_entry(void* pvParameters)
{
    auto* self = static_cast<SensorTask*>(pvParameters);
    self->run();
}

void SensorTask::run()
{
    float last_temperature = NAN;
    int last_humidity = -1;

    while (true)
    {
        ESP_LOGI("SensorTask", "Running sensor task loop...");

        SensorReading sensor_reading = _sensor->read();

        bool changed = false;

        if (isnan(last_temperature) || fabs(sensor_reading.temperature - last_temperature) > 0.1f)
        {
            changed = true;
        }

        if (last_humidity == -1 || sensor_reading.humidity != last_humidity)
        {
            changed = true;
        }

        if (changed)
        {
            bool ok = _sensor_data_transmitter->transmit(sensor_reading);
            if (ok)
            {
                last_temperature = sensor_reading.temperature;
                last_humidity = sensor_reading.humidity;
            }
        }

        vTaskDelay(pdMS_TO_TICKS(3000));
    }
}