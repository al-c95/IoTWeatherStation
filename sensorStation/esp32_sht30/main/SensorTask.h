#pragma once
#include "ISensor.h"
#include "ISensorDataTransmitter.h"

class SensorTask
{
    public:
        explicit SensorTask(ISensor* sensor, ISensorDataTransmitter* sensor_data_transmitter);
        void start();

    private:
        ISensor* _sensor;
        ISensorDataTransmitter* _sensor_data_transmitter;
        static void task_entry(void* pvParameters);
        void run();
};