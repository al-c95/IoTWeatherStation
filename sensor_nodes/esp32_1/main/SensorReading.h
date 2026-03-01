#pragma once
#include <map>
#include <string>
#include <variant>

using SensorValue = std::variant<float, int, int64_t>;

struct SensorReading
{
    virtual ~SensorReading() = default;
    virtual std::map<std::string, SensorValue> get_values() const = 0;
};