#include <string.h>
#include "WiFi.h"
#include "DummySensor.h"
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

static const char *TAG = "WEATHER_STATION_WIFI";

static WiFi wifi;
static DummySensor dummy_sensor;
static const char post_url[] = "http://192.168.1.100:8000/update-temperature-and-humidity-data";
static HttpPostTransmitter data_transmitter = HttpPostTransmitter(post_url);
static SensorTask sensor_task(&dummy_sensor, &data_transmitter);

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