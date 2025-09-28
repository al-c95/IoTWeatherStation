#pragma once
#include <string>
#include "ISensorDataTransmitter.h"

class HttpPostTransmitter : public ISensorDataTransmitter
{
    public:
        explicit HttpPostTransmitter(const char* url);
        bool transmit(const SHT30SensorReading& sensor_reading) override;

    private:
        std::string _url;
};