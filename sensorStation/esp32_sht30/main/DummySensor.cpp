#include "DummySensor.h"
#include <cstdlib>
#include "esp_log.h"

static const char* TAG = "DummySensor";

SHT30SensorReading DummySensor::read()
{
    SHT30SensorReading sensor_reading;

    //sensor_reading.temperature = 25.0f;
    //sensor_reading.humidity = 50;

    float temperature = random_float(20, 30);
    sensor_reading.temperature = temperature;

    int humidity = random_int(0, 100);
    sensor_reading.humidity=humidity;

    ESP_LOGI(TAG, "Generated Temp=%.2f Hum=%d",
             sensor_reading.temperature,
             sensor_reading.humidity);
    
    return sensor_reading;
}

int DummySensor::random_int(int a, int b)
{
    if (a > b)
    {
        return random_int(b, a);
    }

    if (a==b)
    {
        return a;
    }

    return a + (rand() % (b-a));
}

float DummySensor::random_float()
{
    return (float)(rand()) / (float)RAND_MAX;
}

float DummySensor::random_float(int a, int b)
{
    if (a > b)
    {
        return random_float(b, a);
    }

    if (a==b)
    {
        return a;
    }

    return (float)random_int(a, b) + random_float();
}