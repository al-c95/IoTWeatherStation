#pragma once
#include <vector>
#include "ISensor.h"
#include "ISensorDataTransmitter.h"

class SensorTask
{
    public:
        explicit SensorTask(std::vector<ISensor*> sensors, ISensorDataTransmitter* sensor_data_transmitter);
        void start();

    private:
        std::vector<ISensor*> _sensors;
        ISensorDataTransmitter* _sensor_data_transmitter;
        static void task_entry(void* pvParameters);
        void run();
};