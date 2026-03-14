idf_component_register(SRCS "main.cpp" "SensorTask.cpp" "HttpPostTransmitter.cpp" "SHT30Sensor.cpp"
                    REQUIRES WiFi
                    REQUIRES I2CMaster
                    REQUIRES time_sync
                    PRIV_REQUIRES esp_http_client esp_wifi nvs_flash driver
                    INCLUDE_DIRS ".")

target_compile_features(${COMPONENT_LIB} PRIVATE cxx_std_17)
