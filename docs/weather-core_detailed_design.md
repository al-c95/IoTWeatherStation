# weather-core Detailed Design

## HTTP API
The weather-core service is built with Node.JS and TypeScript. It communicates with the frontend and database, and provides endpoints for sensor nodes to transmit live readings.

### Temperature Humidity and Pressure endpoint
REQ-DX - The temperature, humidity and pressure sensor node will transmit data to the following endpoint:

POST /sensor-data/temperature-humidity-pressure

Request body (JSON):

|Field|Type|Units|
|-----|----|-----|
|temperature     |float    |°C     |
|humidity        |int    |%     |
|rawPressure     |float  |hPa|
|timestampUtc    |int    |seconds|

Example payload:
```
{
  "temperature": 24.7,
  "humidity": 63,
  "rawPressure": 1002.0,
  "timestampUtc": 1772333598
}
```

### Current conditions endpoint
REQ-DX - The UI will be able to obtain current weather conditions from the weather-core service via the following Server-Sent Events endpoint:

GET /update-events-sse

Request body (JSON):

None

Response Type:

Server-Sent Events (SSE) stream.
Each `data:` event contains a JSON object representing the most recently known current weather values.

Example SSE Event:
```
data: {"temp": 24.7, "humidity": 63, "dewPoint": 17.2, "timestamp": "14:32:21", "minTemp": 0.0, "minTempAt": 06:00:00, "maxTemp": 25.0, "maxTempAt": "14:00:00", "mslPressure": 1000.2 }
```

### Daily temperature and precipitation endpoint
REQ-DX - the UI will be able to retrieve the last n days of minimum and maximum temperature and precipitation from the weather-core service via the following endpoint:

GET /daily-observations

Query Parameters:
|Name|Type|Required|Default|Description|
|----|----|--------|-------|-----------|
|`days`|integer|No|`7`|Number of days to return (inclusive of today). Must be between 1 and 365.|

Example request:
```
GET /daily-observations?days=3
```

Response (200 OK):
```
{
  "days": 3,
  "data": [
    {
      "year": 2026,
      "month": 1,
      "day": 12,
      "minTemp": 18.2,
      "maxTemp": 31.4,
      "precipitation": 0.0
    },
    {
      "year": 2026,
      "month": 1,
      "day": 11,
      "minTemp": null,
      "maxTemp": null,
      "precipitation": null
    },
    {
      "year": 2026,
      "month": 1,
      "day": 10,
      "minTemp": 17.9,
      "maxTemp": 29.8,
      "precipitation": 4.2
    }
  ]
}
```

Error responses:
400 Bad Request - returned if the `days` parameter is invalid.

### Monthly XLSX weather data export endpoint
REQ-DX - the UI will be able to export an XLSX file of the given month's weather records via the following endpoint:

GET /daily-observations/export/xlsx

Query Parameters:
|Name|Type|Required|Default|Description|
|----|----|--------|-------|-----------|
|`year`|integer|Yes||Calendar year|
|`month`|integer|Yes||Calendar month (1-12)|


### Year to date summary endpoint
REQ-DX - the UI will be able to retreive a year to date summary via the following endpoint:

GET /climatology/year-to-date

Example Response (200 OK):
```
{
   "year": 2026,
   "minTemp": 1.4,
   "minTempAt": "2026-01-16T10:15:28.245Z",
   "maxTemp": 27,
   "maxTempAt": "2026-01-17T10:57:41.740Z"
}
```

## Data validation
The web application will validate the received data and discard or flag values that fall outside realistic physical limits.

The following limits apply to validation of values read by the sensor nodes:
|| Variable | Tolerance |
|---|---|---|
| REQ-DX | Temperature | -40°C - 60°C |
| REQ-DX | Humidity | 0% - 100% |

REQ-DX The web server will silently reject values outside these ranges by displaying a null or empty value, and disregarding them for any analysis or calculation.

## Dew point calculation
REQ-DX - Dew point will be calculated using the Magnus-Tetens approximation:

gamma(T, RH) = ln(RH / 100) + (a · T) / (b + T)

Td = (b · gamma) / (a − gamma)

where:
- T  = air temperature (°C)
- RH = relative humidity (%)
- a  = 17.62
- b  = 243.12 °C

## Mean sea level pressure calculation
REQ-DX - Mean sea level pressure will be calculated using the simplified barometric formula:

P_MSL = P * (1 - h/44330)^(-5.255)

where:
- P_MSL = mean sea level pressure (Pa)
- P = raw pressure reading (Pa)
- h = station elevation (m)

## Alerts
The web application will send email and/or SMS alerts when temperature reaches thresholds. These alerts will be configurable.

REQ-DX - Alerts will be sent when the temperature reaches the configured threshold value in the specified direction (increasing or decreasing). To avoid alert storming, an alert will be triggered once a threshold is breached and will be active for 10 minutes before another alert is able to be triggered. For example, if we configure an alert for temperatures rising above 30.0°C and it briefly breaches this threshold and falls below it again, another alert will not be triggered if it rising above it again within 10 minutes.

Parameters:
|Parameter|Description|
|---------|-----|
|Threshold value     |Numeric temperature value in °C at which alert is triggered.|
|Trend direction      |`Increasing` - trigger when temperature rises past threshold. `Decreasing` - trigger when temperature falls below threshold.|
|Notification channels| Configured in settings: email, SMS|