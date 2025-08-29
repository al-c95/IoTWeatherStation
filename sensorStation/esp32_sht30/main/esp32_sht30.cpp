#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"
#include "freertos/task.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_log.h"
#include "nvs_flash.h"
#include "esp_netif.h"
#include "esp_http_client.h"

static const char *TAG = "WIFI_EXAMPLE";

#define WIFI_SSID  "SSID"
#define WIFI_PWD   "PWD"
#define READINGS_API_URL    "http://192.168.1.100:8000/update-temperature-and-humidity-data"

// FreeRTOS event group to signal when connected
static EventGroupHandle_t wifi_event_group;
#define WIFI_CONNECTED_BIT BIT0

struct SHT30Reading
{
    float temperature;
    int humidity;
};

static SHT30Reading read_sensor_stub()
{
    SHT30Reading sensor_reading;
    sensor_reading.temperature = 20.0f + (rand() % 1000) / 100.0f; // 20.0–29.9 °C
    sensor_reading.humidity    = 40 + (rand() % 20);               // 40–59 %

    return sensor_reading;
}

static void http_post_reading(const SHT30Reading &sensor_reading)
{
    char post_data[128];
    snprintf(post_data, sizeof(post_data),
             "{\"temperature\": %.2f, \"humidity\": %d}",
             sensor_reading.temperature, sensor_reading.humidity);

    esp_http_client_config_t config = {
        .url = READINGS_API_URL,
        .method = HTTP_METHOD_POST,
    };

    esp_http_client_handle_t client = esp_http_client_init(&config);
    esp_http_client_set_header(client, "Content-Type", "application/json");
    esp_http_client_set_post_field(client, post_data, strlen(post_data));

    esp_err_t err = esp_http_client_perform(client);
    if (err == ESP_OK)
    {
        ESP_LOGI(TAG, "POST OK, status=%d",
                 esp_http_client_get_status_code(client));
    } 
    else
    {
        ESP_LOGE(TAG, "POST failed: %s", esp_err_to_name(err));
    }
    esp_http_client_cleanup(client);
}

static void sensor_task(void *pvParameters)
{
    srand((unsigned)time(NULL));

    while (1)
    {
        SHT30Reading sensor_reading = read_sensor_stub();
        ESP_LOGI(TAG, "Reading -> Temp=%.2f °C, Hum=%d %%", sensor_reading.temperature, sensor_reading.humidity);
        http_post_reading(sensor_reading);
        vTaskDelay(pdMS_TO_TICKS(3000)); // every 3s
    }
}

// event handler
static void wifi_event_handler(void* arg, esp_event_base_t event_base,
                               int32_t event_id, void* event_data)
{
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START)
    {
        esp_wifi_connect();
    }
    else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED)
    {
        ESP_LOGI(TAG, "Disconnected, retrying...");
        esp_wifi_connect();
    }
    else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP)
    {
        ip_event_got_ip_t* event = (ip_event_got_ip_t*) event_data;
        ESP_LOGI(TAG, "Got IP: " IPSTR, IP2STR(&event->ip_info.ip));
        xEventGroupSetBits(wifi_event_group, WIFI_CONNECTED_BIT);
    }
}

static void wifi_init_sta(void)
{
	wifi_event_group = xEventGroupCreate();
	
	ESP_ERROR_CHECK(esp_netif_init());
	ESP_ERROR_CHECK(esp_event_loop_create_default());
	esp_netif_create_default_wifi_sta();
	
	wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
	ESP_ERROR_CHECK(esp_wifi_init(&cfg));
	
	esp_event_handler_instance_t instance_any_id;
	esp_event_handler_instance_t instance_got_ip;
	ESP_ERROR_CHECK(esp_event_handler_instance_register(WIFI_EVENT,
	                                                        ESP_EVENT_ANY_ID,
	                                                        &wifi_event_handler,
	                                                        NULL,
	                                                        &instance_any_id));
	    ESP_ERROR_CHECK(esp_event_handler_instance_register(IP_EVENT,
	                                                        IP_EVENT_STA_GOT_IP,
	                                                        &wifi_event_handler,
	                                                        NULL,
	                                                        &instance_got_ip));
	
	    wifi_config_t wifi_config = {};
	    strcpy((char*)wifi_config.sta.ssid, WIFI_SSID);
	    strcpy((char*)wifi_config.sta.password, WIFI_PWD);
	    wifi_config.sta.threshold.authmode = WIFI_AUTH_WPA2_PSK;
	
	    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA) );
	    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config) );
	    ESP_ERROR_CHECK(esp_wifi_start() );
	
	    ESP_LOGI(TAG, "wifi_init_sta finished.");
}

extern "C" void app_main(void)
{
	// NVS required by Wi-Fi driver
	ESP_ERROR_CHECK(nvs_flash_init());
	
	ESP_LOGI(TAG, "ESP_WIFI_MODE_STA");
	wifi_init_sta();
	
	// wait until connected
	EventBits_t bits = xEventGroupWaitBits(wifi_event_group,
											WIFI_CONNECTED_BIT,
											pdFALSE,
											pdFALSE,
											portMAX_DELAY);
	if (bits & WIFI_CONNECTED_BIT)
	{
		ESP_LOGI(TAG, "Connected to AP SSID:%s password:%s", WIFI_SSID, WIFI_PWD);
	}

    // start sensor task once WiFi ready
    xTaskCreate(sensor_task, "sensor_task", 4096, NULL, 5, NULL);
}