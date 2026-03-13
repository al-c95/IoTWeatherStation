#pragma once
#include <string>
#include <map>
#include "ISensorDataTransmitter.h"

class HttpPostTransmitter : public ISensorDataTransmitter
{
    public:
        explicit HttpPostTransmitter(const char* url);
        bool transmit(const std::map<std::string, SensorValue>& sensor_values) override;

    private:
        std::string _url;
};