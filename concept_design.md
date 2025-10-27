# Concept Design
## System Overview
The system comprises three logical layers:
1. Sensor layer (ESP32 nodes)
2. Backend layer (FastAPI)
3. Frontend layer (React)

## System Architecture
![architecture](architecture.drawio.png)

## Requirements
- REQ-1 Sensor data acquisition - sensor values will be read every 3 s, or as appropriate for the particular variable.
- REQ-2 Change detection - sensor nodes will transmit data only when values change beyond tolerance (0.1°C for temperature, 1% for humidity, appropriate values for other variables).
- REQ-3 Minima and maxima - the web application will record daily minima and maxima (temperatures). These values will be stored as daily records in the database.
- REQ-4 Current conditions - the web application will provide a live display of current conditions, including temperature, humidity, and others.
- REQ-5 Past weather - the web application will be able to provide a summary of recent weather observations, including data and a textual summary.
- REQ-6 Exports - the web application will support exporting of daily weather records by calendar month in Excel format.
- REQ-7 Communications protocol - sensor nodes will transmit readings to the web server via REST API (HTTP).
- REQ-8 Data caching and resilience - sensor nodes will continue to monitor the environment, storing any transmittable values in the event of a disconnection to the web server, syncing the data once communication is re-established.
- REQ-9 Future extensibility - the web application and sensor node software will be extensible to easily support additional future sensors.
- REQ-10 Climatology - the web application will be able to analyse the collected weather data to produce climatological information.