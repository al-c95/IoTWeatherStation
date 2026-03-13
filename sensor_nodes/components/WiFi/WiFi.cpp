#include <string>
#include <cstring>
#include "WiFi.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "nvs_flash.h"
#include "esp_log.h"

void WiFi::init(OnWifiConnected_f conn, OnWifiDisconnected_f disc)
{
    m_connected = conn;
    m_disconnected = disc;

    esp_err_t err = nvs_flash_init();
    if (err == ESP_ERR_NVS_NO_FREE_PAGES || err == ESP_ERR_NVS_NEW_VERSION_FOUND)
    {
        nvs_flash_erase();
        nvs_flash_init();
    }

    esp_netif_init();
    esp_event_loop_create_default();
    esp_netif_create_default_wifi_sta();

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    esp_wifi_init(&cfg);
    esp_event_handler_register(WIFI_EVENT, ESP_EVENT_ANY_ID, handle_wifi_event, this);
    esp_event_handler_register(IP_EVENT, IP_EVENT_STA_GOT_IP, handle_wifi_event, this);
}

void WiFi::connect(const char* ssid, const char* pwd)
{
    wifi_config_t wifi_config = {};
    strcpy((char*)wifi_config.sta.ssid, ssid);
	strcpy((char*)wifi_config.sta.password, pwd);
	wifi_config.sta.threshold.authmode = WIFI_AUTH_WPA2_PSK;

    esp_wifi_set_mode(WIFI_MODE_STA);
    esp_wifi_set_config(WIFI_IF_STA, &wifi_config);
    esp_wifi_start();
}

void WiFi::handle_wifi_event(void *arg, esp_event_base_t event_base, int32_t event_id, void *event_data)
{
    ESP_LOGI("WiFi", "handle_wifi_event called: base=%s, id=%ld", event_base, event_id);

    WiFi *obj = reinterpret_cast<WiFi *>(arg);
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START)
    {
        esp_wifi_connect();
    }
    else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED)
    {
        obj->m_disconnected();
        vTaskDelay(pdMS_TO_TICKS(3000));
        esp_wifi_connect();
    }
    else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP)
    {
        ip_event_got_ip_t *event = reinterpret_cast<ip_event_got_ip_t *>(event_data);
        obj->m_connected(&event->ip_info.ip);
    }
}