# Detailed design

## Configuration File
REQ-DX - The web application will use a JSON configuration file to store metadata about the weather station:

|Field|Type|Units|Required|Description|
|-----|----|-----|-----------|----|
|`station_name`|string|N/A|Yes|Human-readable name of the station, displayed in UI and metadata pages.
|`latitude`|float|degrees|Yes|Geographic latitude|

## User Interface
The user interface is built with React.JS. It communicates with the web server using the REST API and Server-Sent Events.

REQ-DX - The user interface will display current conditions, which are the latest values and their timestamps, obtained from the web server via Server-Sent Events.

REQ-DX - The user interface will display weather station metadata, including:

- Station name
- Latitude and longitude
- Elevation in metres

REQ-DX - The user interface will display minimum temperature, maximum temperature, and precipitation for the last five days in a table.

REQ-DX - The user interface will provide an option to export daily weather data for a calendar month in XLSX format.

## Web server API
The web application is built with FastAPI. It communicates with the frontend and database, and provides endpoints for sensor nodes to transmit live readings.

### Temperature and Humidity endpoint
REQ-DX - The temperature and humidity sensor node will transmit data to the following endpoint:

POST /sensor-data/temperature-humidity

Request body (JSON):

|Field|Type|Units|
|-----|----|-----|
|temperature     |float    |°C     |
|humidity        |int    |%     |

Example payload:
```
{
  "temperature": 24.7,
  "humidity": 63
}
```

### Current conditions endpoint
REQ-DX - The UI will be able to retrieve current weather conditions from the web server via the following Server-Sent Events endpoint:

GET /update-events-sse

Request body (JSON):

None

Response Type:

Server-Sent Events (SSE) stream.
Each `data:` event contains a JSON object representing the most recently known current weather values.

Example SSE Event:
```
data: {"temperature": 24.7, "humidity": 63, "last_update_temperature_and_humidity":"20:32:21"}
```

Event Frequency:

Up to 10 events per second (every 0.1 seconds), but values only truly change when new sensor data arrives.

#### Daily observations
REQ-DX - The UI will be able to display 

## Temperature and Humidity sensor node
This sensor node consists of an ESP32-S3, interfaced with an SHT30 temperature and humidity sensor via I2C.

REQ-DX - SHT30 will measure temperature and humidity every 3 seconds, and will transmit to the web server via HTTP POST only when the values change:

![architecture](sensor-data-temperature-humidity-uml.png)

## Web server data validation
The web application will validate the received data and discard or flag values that fall outside realistic physical limits.

The following limits apply to validation of values read by the sensor nodes:
|| Variable | Tolerance |
|---|---|---|
| REQ-DX | Temperature | -40°C - 60°C |
| REQ-DX | Humidity | 0% - 100% |

REQ-DX The web server will silently reject values outside these ranges by displaying a null or empty value, and disregarding them for any analysis or calculation.

## Alerts
The web application will send email and/or SMS alerts when temperature reaches thresholds. These alerts will be configurable.

REQ-DX - Alerts will be sent when the temperature reaches the configured threshold value in the specified direction (increasing or decreasing).

Parameters:
|Parameter|Description|
|---------|-----|
|Threshold value     |Numeric temperature value in °C at which alert is triggered.|
|Trend direction      |`Increasing` - trigger when temperature rises past treshold. `Decreasing` - trigger when temperature falls below threshold.|
|Notification channels| Configured in settings: email|