idf_component_register(SRCS "esp32_sht30.cpp"
                    PRIV_REQUIRES esp_http_client esp_wifi nvs_flash
                    INCLUDE_DIRS ".")

target_compile_features(${COMPONENT_LIB} PRIVATE cxx_std_14)
