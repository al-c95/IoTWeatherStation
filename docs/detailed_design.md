# Detailed design

- All temperature values shall be in degrees celsius.

## Configuration File
REQ-DX - The web application will use a JSON configuration file to store metadata about the weather station:

|Field|Type|Units|Required|Description|
|-----|----|-----|-----------|----|
|`station_name`|string|N/A|Yes|Human-readable name of the station, displayed in UI and metadata pages.
|`latitude`|float|degrees|Yes|Geographic latitude|
|`longitude`|float|degrees|Yes|Geographic longitude|
|`elevation`|int|metres|Yes|Elevation|
|`alerts`|JSON array||Yes|Alerts configuration|

Each object in `alerts` array:
|Field|Type|Units|Required|Description|
|-----|----|-----|-----------|----|
|`type`|"temperature"||||
|`trend`| "increasing" or "decreasing" ||Yes|Direction of threshold crossing|
|`threshold`|float|°C|Yes|Threshold at which alert triggers|
|`recipients`|JSON array||Yes|Email addresses of recipients|

The configuration file will be used by the frontend application and backend services to access metadata about the station.

## Database
The database is Sqlite, stored locally. It will have the following schema:

### Data dictionary
daily_weather
|Field|Type|Units/Domain|Nullable?|Default|PK/FK?|Description|
|-----|----|------------|---------|-------|------|-----------|
|date|TEXT|YYYY-MM-DD|No||PK
|min_temp|FLOAT| |Yes| | | |
|max_temp|FLOAT| |Yes| | | |
|precipitation|FLOAT| |Yes| | | |
Unique constraint on date.

observations
|Field|Type|Units/Domain|Nullable?|Default|PK/FK?|Description|
|-----|----|------------|---------|-------|------|-----------|
|id|INTEGER||No||PK
|timestamp|DATETIME||No||
|temperature|FLOAT||Yes
|humidity|INTEGER||Yes
|pressure|FLOAT||Yes

## User Interface
The user interface is built with React.JS. It communicates with the weather-core web server using the REST API and Server-Sent Events.

REQ-DX - The user interface will display current conditions, which are the latest values of temperature, humidity, dew point, precipitation, wind, and their timestamps, obtained from the web server via Server-Sent Events.

REQ-DX - The user interface will display weather station metadata, including:

- Station name
- Latitude and longitude
- Elevation in metres

REQ-DX - The user interface will display minimum temperature, maximum temperature, and precipitation for the last five days in a table.

REQ-DX - The user interface will provide an option to export daily weather data for a calendar month in XLSX format.

REQ-DX - The user interface will provide an option to import daily weather data for a calendar month in XLSX format.

REQ-DX - The user interface will display a "year to date" summary, including:
- Lowest temperature
- Highest temperature
- Total rainfall to date

REQ-DX - The user interface will display an "almanac" for the current month, including:
- Lowest minimum temperature this month
- Highest maximum temperature this month
- Long term average temperatures for the month (when climatology data is available).

REQ-DX - The user interface will display a "day-of-year climatological summary", including:
- Mean minimum temperature
- Mean maximum temperature
- Lowest recorded temperature
- Highest recorded temperature
- Highest daily rainfall

REQ-DX - The user interface will display climatological data from the weather station, calculated from the observations.