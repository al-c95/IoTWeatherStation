idf_component_register(SRCS "main.cpp" "WiFi.cpp" "DummySensor.cpp" "SensorTask.cpp" "HttpPostTransmitter.cpp"
                    PRIV_REQUIRES esp_http_client esp_wifi nvs_flash
                    INCLUDE_DIRS ".")

target_compile_features(${COMPONENT_LIB} PRIVATE cxx_std_14)
