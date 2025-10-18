#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"
#include "freertos/task.h"
#include "esp_log.h"
#include <math.h>
#include "SensorTask.h"
#include <memory>

static const char *TAG = "SENSOR_TASK";

SensorTask::SensorTask(std::vector<ISensor*> sensors, ISensorDataTransmitter* sensor_data_transmitter)
    : _sensors(sensors), _sensor_data_transmitter(sensor_data_transmitter)
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
    auto values_equal = [](const SensorValue& a, const SensorValue& b, float tolerance = 0.1f)
    {
        if (a.index() != b.index())
        {
            return false;
        }       

        if (std::holds_alternative<int>(a))
        {
            return std::get<int>(a) == std::get<int>(b);
        }
            
        return std::fabs(std::get<float>(a) - std::get<float>(b)) <= tolerance;
    };

    // last values per sensor (key is sensor name)
    std::map<std::string, SensorValue> last_values;

    while (true)
    {
        ESP_LOGI("SensorTask", "Running sensor task loop...");

        std::map<std::string, SensorValue> current_values;
        bool changed = false;
        
        for (auto* sensor : _sensors)
        {
            auto reading = sensor->read();
            const auto& values = reading->get_values();

            for (const auto& [key, value] : values)
            {
                std::string full_key = std::string(sensor->name()) + "." + key;
                current_values[full_key] = value;

                auto it = last_values.find(full_key);
                if (it == last_values.end() || !values_equal(it->second, value))
                {
                    changed = true;
                }
            }
        }

        // if values changed, store and transmit
        if (changed)
        {
            bool ok = _sensor_data_transmitter->transmit(current_values);
            if (ok)
            {
                last_values = current_values;
            }
            else
            {
                ESP_LOGW(TAG, "Transmission failed");
            }
        }

        vTaskDelay(pdMS_TO_TICKS(3000));
    }
}