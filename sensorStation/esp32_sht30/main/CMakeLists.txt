idf_component_register(SRCS "main.cpp" "WiFi.cpp" "SensorTask.cpp" "HttpPostTransmitter.cpp" "I2CMaster.cpp" "SHT30Sensor.cpp"
                    PRIV_REQUIRES esp_http_client esp_wifi nvs_flash driver
                    INCLUDE_DIRS ".")

target_compile_features(${COMPONENT_LIB} PRIVATE cxx_std_17)
