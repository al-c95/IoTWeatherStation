# weather-analysis Detailed Design

## HTTP API

The weather-analysis service is built with FastAPI and Python. It provides endpoints for AI and other analysis of weather data.

### One-shot AI response streaming endpoint
```http
GET /llm/prompt?prompt={prompt}
```

Query parameters:
| Field | Type | Required | Description |
|---|---|---|---|
| `prompt` | string | Yes | Natural language prompt for the AI |

Example request:
```http
GET /llm/prompt?prompt=What%20was%20the%20hottest%20April%2010th%20ever%3F
```

Example response:
```txt
HTTP/1.1 200 OK
Content-Type: text/event-stream

data: {"chunk":"The hottest "}

data: {"chunk":"April 10th "}

data: {"chunk":"was 29.4°C "}

data: {"chunk":"on 2018-04-10."}

data: {"done":true}
```

Each `data:` event contains a JSON object. Response chunks are sent using the `chunk` field. The stream ends when a `data: {"done": true}` event is received.

---

### Conversational AI chat streaming endpoint

```http
POST /llm/chat
```

Request body:
| Field | Type | Required | Description |
|---|---|---|---|
| `messages` | array | Yes | Chat message history |

Message object format:
| Field | Type | Required | Description |
|---|---|---|---|
| `role` | string | Yes | Message role (`user` or `assistant`) |
| `content` | string | Yes | Message content |

Example request:
```http
POST /llm/chat
Content-Type: application/json
```

```json
{
  "messages": [
    {
      "role": "user",
      "content": "What was the hottest April 10th ever?"
    },
    {
      "role": "assistant",
      "content": "The hottest April 10th was 29.4°C on 2018-04-10."
    },
    {
      "role": "user",
      "content": "What about April 11th?"
    }
  ]
}
```

Example response:
```txt
HTTP/1.1 200 OK
Content-Type: text/event-stream

data: {"chunk":"The hottest "}

data: {"chunk":"April 11th "}

data: {"chunk":"was 31.1°C "}

data: {"chunk":"on 2017-04-11."}

data: {"done":true}
```

The endpoint maintains conversational context by using the supplied message history.

Each `data:` event contains a JSON object. Response chunks are sent using the `chunk` field. The stream ends when a `data: {"done": true}` event is received.

### Climatology endpoint - full climatology data

REQ-DX - the weather-analysis service will provide an endpoint to retrieve climatology data.

```http
GET /climatology/full-monthly
```

Example response:

```txt
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "months": [
    {
      "month": 1,
      "month_name": "January",
      "record_count": 434,
      "year_count": 14,
      "statistics": {
        "mean_min_temp": 19.4,
        "mean_daily_temp": 24.8,
        "mean_max_temp": 30.2,

        "lowest_min_temp": {
          "value": 11.8,
          "date": "2018-01-22"
        },

        "highest_min_temp": {
          "value": 26.1,
          "date": "2020-01-05"
        },

        "lowest_max_temp": {
          "value": 19.7,
          "date": "2017-01-14"
        },

        "highest_max_temp": {
          "value": 44.2,
          "date": "2020-01-04"
        },

        "decile_1_min_temp": 15.3,
        "decile_1_max_temp": 23.6,

        "decile_9_min_temp": 23.0,
        "decile_9_max_temp": 37.9,

        "mean_days_min_lte_0": 0.0,
        "mean_days_min_lte_2": 0.0,
        "mean_days_min_lte_5": 0.0,

        "mean_days_max_gte_30": 14.8,
        "mean_days_max_gte_35": 5.3,
        "mean_days_max_gte_40": 1.1
      }
    },

    {
      "month": 2,
      "month_name": "February",
      "record_count": 395,
      "year_count": 14,
      "statistics": {
        "mean_min_temp": 18.8,
        "mean_daily_temp": 24.0,
        "mean_max_temp": 29.2,

        "lowest_min_temp": {
          "value": 12.0,
          "date": "2016-02-17"
        },

        "highest_min_temp": {
          "value": 25.7,
          "date": "2017-02-10"
        },

        "lowest_max_temp": {
          "value": 18.9,
          "date": "2022-02-25"
        },

        "highest_max_temp": {
          "value": 42.3,
          "date": "2017-02-11"
        },

        "decile_1_min_temp": 14.9,
        "decile_1_max_temp": 22.8,

        "decile_9_min_temp": 22.4,
        "decile_9_max_temp": 36.4,

        "mean_days_min_lte_0": 0.0,
        "mean_days_min_lte_2": 0.0,
        "mean_days_min_lte_5": 0.0,

        "mean_days_max_gte_30": 11.6,
        "mean_days_max_gte_35": 3.9,
        "mean_days_max_gte_40": 0.8
      }
    }
  ]
}
```

The response contains climatology statistics grouped by calendar month. Threshold day counts are calculated per year and averaged across all available years for the month.

## Climatology calculations
REQ-DX - For each calendar month, the following statistics are calculated and displayed when climatology data is available:
- Mean minimum temperature
- Mean daily temperature (average of minimum and maximum)
- Mean maximum temperature
- Lowest minimum temperature and calendar date
- Highest minimum temperature and calendar date
- Lowest maximum temperature and calendar date
- Highest maximum temperature and calendar date
- Decile 1 minimum temperature
- Decile 1 maximum temperature
- Decile 9 minimum temperature
- Decile 9 maximum temperature
- Mean number days <=0°C
- Mean number days <=2°C
- Mean number days <=5°C
- Mean number days >=30°C
- Mean number days >=35°C
- Mean number days >=40°C
- Total rainfall
- Highest daily rainfall and calendar date
- Total rain days
- Total thunderstorm days
- Total fog days
- Total hail days
- Total dust days
- Total snow days
- Highest wind gust and date

REQ-DX - Calendar month statistics will be used to calculate overall climatology for each month of the year. This includes:
- Mean minimum temperature
- Lowest minimum temperature and calendar date
- Highest minimum temperature and calendar date
- Mean maximum temperature
- Lowest maximum temperature and calendar date
- Highest maximum temperature and calendar date
- Mean rainfall
- Highest daily rainfall and calendar date
- Mean rain days
- Mean thunderstorm days
- Mean fog days
- Mean hail days
- Mean dust days
- Mean snow days
- Highest wind gust and calendar date