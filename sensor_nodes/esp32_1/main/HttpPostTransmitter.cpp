#include "HttpPostTransmitter.h"
#include "esp_log.h"
#include "esp_http_client.h"
#include <string.h>
#include <iostream>
#include <sstream>
#include <memory>
#include <iomanip>

static const char *TAG = "HTTP_POST_TRANSMITTER";

HttpPostTransmitter::HttpPostTransmitter(const char* url)
    : _url(url)
{

}

bool HttpPostTransmitter::transmit(const std::map<std::string, SensorValue>& sensor_values)
{
    ESP_LOGI(TAG, "Transmitting sensor reading...");

    // build JSON payload
    std::ostringstream json;
    json.setf(std::ios::fixed, std::ios::floatfield);
    json.precision(1);
    json << "{";
    for (auto it = sensor_values.begin(); it != sensor_values.end(); ++it)
    {
        json << "\"" << it->first << "\": ";
        std::visit([&](auto&& arg)
        {
            json << arg;
        }, it->second);

        if (std::next(it) != sensor_values.end())
        {
            json << ", ";
        }
    }
    json << "}";
    std::string json_str = json.str();
    char post_data[256];
    snprintf(post_data, sizeof(post_data), "%s", json_str.c_str());

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

    // send HTTP POST
    ESP_LOGI(TAG, "POST data: %s", post_data);
    esp_err_t err = esp_http_client_perform(client);
    if (err == ESP_OK)
    {
        int status = esp_http_client_get_status_code(client);
        ESP_LOGI(TAG, "POST OK, status=%d", status);
        esp_http_client_cleanup(client);

        return (status >= 200 && status < 300);
    } 
    else
    {
        ESP_LOGE(TAG, "POST failed: %s", esp_err_to_name(err));
        esp_http_client_cleanup(client);
        
        return false;
    }
}