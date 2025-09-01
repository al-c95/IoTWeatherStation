#include "HttpPostTransmitter.h"
#include "esp_log.h"
#include "esp_http_client.h"
#include <string.h>

static const char *TAG = "HTTP_POST_TRANSMITTER";

HttpPostTransmitter::HttpPostTransmitter(const char* url)
    : _url(url)
{

}

bool HttpPostTransmitter::transmit(const SensorReading& sensor_reading)
{
    ESP_LOGI(TAG, "Transmitting sensor reading...");

    // build JSON payload
    char post_data[128];
    snprintf(post_data, sizeof(post_data),
             "{\"temperature\": %.2f, \"humidity\": %d}",
             sensor_reading.temperature,
             sensor_reading.humidity);

    // configure HTTP client
    esp_http_client_config_t config = {
        .url = _url.c_str(),
        .method = HTTP_METHOD_POST,
    };
    esp_http_client_handle_t client = esp_http_client_init(&config);
    if (!client)
    {
        ESP_LOGE(TAG, "Failed to initialise HTTP client!");

        return false;
    }

    esp_http_client_set_header(client, "Content-Type", "application/json");
    esp_http_client_set_post_field(client, post_data, strlen(post_data));

    esp_err_t err = esp_http_client_perform(client);
    if (err == ESP_OK)
    {
        int status = esp_http_client_get_status_code(client);
        ESP_LOGI(TAG, "POST OK, status=%d", status);
        esp_http_client_cleanup(client);

        return (status >= 200 && status < 300);
    } else
    {
        ESP_LOGE(TAG, "POST failed: %s", esp_err_to_name(err));
        esp_http_client_cleanup(client);
        
        return false;
    }
}