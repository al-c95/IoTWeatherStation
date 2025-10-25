#pragma once
#include <functional>
#include "esp_wifi.h"

using OnWifiConnected_f = std::function<void(const esp_ip4_addr_t*)>;
using OnWifiDisconnected_f = std::function<void(void)>;

class WiFi
{
    private:
        OnWifiConnected_f m_connected;
        OnWifiDisconnected_f m_disconnected;

        static void handle_wifi_event(void *arg, esp_event_base_t event_base, int32_t event_id, void *event_data);

    public:
        void init(OnWifiConnected_f conn, OnWifiDisconnected_f disc);
        void connect(const char* ssid, const char* pwd);
};