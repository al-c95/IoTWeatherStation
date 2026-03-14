#include "time_sync.h"
#include "esp_log.h"
#include "esp_sntp.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include <sys/time.h>
#include <time.h>

static const char* TAG = "TIME_SYNC";
static const int VALID_YEAR = 2020;

static bool year_is_valid(void)
{
    time_t now = 0;
    struct tm timeinfo = {};
    time(&now);
    localtime_r(&now, &timeinfo);

    return (timeinfo.tm_year >= (VALID_YEAR - 1900));
}

void time_sync_start(void)
{
    ESP_LOGI(TAG, "Starting SNTP");

    esp_sntp_setoperatingmode(SNTP_OPMODE_POLL);

    esp_sntp_setservername(0, "0.au.pool.ntp.org");
    esp_sntp_setservername(1, "1.au.pool.ntp.org");

    esp_sntp_init();
}

bool time_sync_wait_until_synced(int max_wait_seconds)
{
    const int poll_ms = 2000;
    int waited_ms = 0;

    while (!year_is_valid() && waited_ms < max_wait_seconds * 1000)
    {
        ESP_LOGI(TAG, "Waiting for time sync...");
        
        vTaskDelay(pdMS_TO_TICKS(poll_ms));
        waited_ms += poll_ms;
    }

    if (!year_is_valid())
    {
        ESP_LOGW(TAG, "Time sync timeout");

        return false;
    }

    ESP_LOGI(TAG, "Time synced");

    return true;
}

bool time_sync_is_valid(void)
{
    return year_is_valid();
}

int64_t time_sync_utc_now_ms(void)
{
    struct timeval tv;
    gettimeofday(&tv, nullptr);

    return (int64_t)tv.tv_sec * 1000LL + tv.tv_usec / 1000;
}