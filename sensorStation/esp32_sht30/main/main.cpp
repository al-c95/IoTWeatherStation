#include <string.h>
#include "WiFi.h"
#include "DummySensor.h"
#include "SHT30Sensor.h"
#include "SensorTask.h"
#include "HttpPostTransmitter.h"
#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"
#include "freertos/task.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"
#include "nvs_flash.h"
#include "esp_netif.h"
#include "esp_http_client.h"

#define I2C_PORT       I2C_NUM_0
#define I2C_SDA_PIN    GPIO_NUM_8
#define I2C_SCL_PIN    GPIO_NUM_9
#define I2C_FREQ_HZ    100000 // 100kHz is fine for SHT30

static const char *TAG = "WEATHER_STATION_WIFI";

static WiFi wifi;
static DummySensor dummy_sensor;
static I2CMaster i2c_master(I2C_PORT, I2C_SDA_PIN, I2C_SCL_PIN, I2C_FREQ_HZ, false);
const uint8_t SHT30_ADDR = 0x44;
static SHT30Sensor sht30_sensor(i2c_master, SHT30_ADDR);
static const char post_url[] = "http://192.168.1.100:8000/update-temperature-and-humidity-data";
static HttpPostTransmitter data_transmitter = HttpPostTransmitter(post_url);
//static SensorTask sensor_task(&dummy_sensor, &data_transmitter);
static SensorTask sensor_task(&sht30_sensor, &data_transmitter);

extern "C" void app_main(void)
{
    const char ssid[] = "ssid";
    const char pwd[] = "pwd";

    auto connected = [](const esp_ip4_addr_t* ip)
    {
        ESP_LOGI(TAG, "WiFi connected!");

        sensor_task.start();
    };

    auto disconnected = []()
    {
        ESP_LOGW(TAG, "WiFi disconnected!");
    };

    wifi.init(connected, disconnected);
    wifi.connect(ssid, pwd);
}