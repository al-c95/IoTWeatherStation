# 🌦️ IoT Weather Station

## Introduction
IoT weather station implemented using **ESP32 microcontroller–based sensor nodes**, a **FastAPI web server**, and a **React web UI frontend**.  
Designed to operate as a **backyard hobby weather station**, collecting live temperature, humidity, and other environmental data.  
May be integrated into a future **smart home hub**.

## Project Approach
This project is managed as a **hybrid systems engineering and agile software** project:

- **Concept Design** — describes the high-level architecture and requirements, and serves as a baseline for implementation. Changes infrequently.  
- **Detailed Design** — describes the software implementation at a lower level. A *living* document that may evolve frequently as features are added or refined.

### Development and Test Plan
High-level system requirements in the **Concept Design** are traced to requirements in the **Detailed Design**.  
Detailed design requirements are further traced to **test cases**, written as features are developed.

#### Testing Strategy
Before each major revision or release, the following test cycles are performed:

- **Unit Tests** — Validate individual components of the firmware, backend, and UI.  
  *Target: ≥70% code coverage.*
- **Integration Tests** — Verify interactions between major software components (e.g., FastAPI endpoints tested using Postman or simulator scripts).
- **End-to-End Tests** — Acceptance tests run with the full software stack, validating complete user flows.

### Repo structure
- `dashboard` directory - contains React and FastAPI servers, along with scripts to run the various components.
- `sensorStation\esp32_sht30` directory - contains ESP-IDF project for the sensor node.

## TODO
- unit tests
- concept design
- detailed design
- UI improvements

## Running
1. Connect ESP32-S3 development board to PC via USB. Make a note of the port in Device Manager (Windows).
2. Start the FastAPI web server (from dashboard project directory):
```
start_api.bat
```
3. Using ESP-IDF CMD, compile and flash the code (from the sensor node project directory):
```
idf.py build
idf.py -p {port} flash monitor
```
If the sensor reads and API calls are successful, there should be an output like the following:
```
I (626) wifi:dp: 1, bi: 102400, li: 3, scale listen interval from 307200 us to 307200 us
I (636) wifi:set rx beacon pti, rx_bcn_pti: 0, bcn_timeout: 25000, mt_pti: 0, mt_time: 10000
I (646) WiFi: handle_wifi_event called: base=WIFI_EVENT, id=4
I (656) wifi:<ba-add>idx:0 (ifx:0, a2:6e:84:76:13:1f), tid:0, ssn:1, winSize:64
I (716) wifi:AP's beacon interval = 102400 us, DTIM period = 1
I (3166) esp_netif_handlers: sta ip: 192.168.1.102, mask: 255.255.255.0, gw: 192.168.1.1
I (3166) WiFi: handle_wifi_event called: base=IP_EVENT, id=0
I (3166) WEATHER_STATION_WIFI: WiFi connected!
I (3166) SensorTask: Running sensor task loop...
I (3196) SHT30Sensor: Read -> Temp=26.2 Hum=57
I (3196) HTTP_POST_TRANSMITTER: Transmitting sensor reading...
I (3576) HTTP_POST_TRANSMITTER: POST OK, status=200
I (6576) SensorTask: Running sensor task loop...
I (6596) SHT30Sensor: Read -> Temp=26.2 Hum=57
I (9596) SensorTask: Running sensor task loop...
I (9616) SHT30Sensor: Read -> Temp=26.2 Hum=57
I (12616) SensorTask: Running sensor task loop...
I (12636) SHT30Sensor: Read -> Temp=26.2 Hum=57
```
4. Start React server (from dashboard project directory):
```
start_react.bat
```