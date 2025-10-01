#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"
#include "freertos/task.h"
#include "esp_log.h"
#include <math.h>
#include "SensorTask.h"
#include <memory>

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
    std::map<std::string, SensorValue> last_values;

    while (true)
    {
        ESP_LOGI("SensorTask", "Running sensor task loop...");

        auto reading = _sensor->read();
        auto values = reading->get_values();

        bool changed = false;

        for (const auto& [key, value] : values)
        {
            auto it = last_values.find(key);
            if (it == last_values.end() || it->second != value)
            {
                changed = true;
                break;
            }
        }

        if (changed)
        {
            bool ok = _sensor_data_transmitter->transmit(*reading);
            if (ok)
            {
                last_values = values;
            }
        }

        vTaskDelay(pdMS_TO_TICKS(3000));
    }
}