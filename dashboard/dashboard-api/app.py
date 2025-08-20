from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
import asyncio
import json
from fastapi import FastAPI, HTTPException
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from DailyWeather import *
from wind import *
from database import SessionLocal, engine
from utils import get_timestamp_now


app = FastAPI()

origins = [
    "http://localhost:5173",
    "https://6d162bf8a2fc.ngrok-free.app/"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # allow these origins
    allow_credentials=True,
    allow_methods=["*"],        # allow all methods (GET, POST, etc)
    allow_headers=["*"],        # allow all headers
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session


current_data = {
    "temperature": "-",
    "high_temperature": "-",
    "high_temperature_time": "-",
    "low_temperature": "-",
    "low_temperature_time": "-",
    "humidity": "-",
    "last_update_temperature_and_humidity": "-",
    "wind_speed": "-",
    "wind_direction": "-",
    "last_update_wind_speed": "-",
    "sustained_wind": "-",
    "wind_gusts": "-",
    "highest_wind_gust": "-",
    "highest_wind_gust_time": "-",
    "highest_wind_gust_direction": "-"
}
current_data_lock = asyncio.Lock()


def format_last_update_time(timestamp):
    return timestamp.strftime("%Y-%m-%d %H:%M:%S")


def format_extreme_reading_time(timestamp):
    return timestamp.strftime("%H:%M:%S")


class TemperatureAndHumiditySensorData(BaseModel):
    temperature: float
    humidity: int


class WindSensorData(BaseModel):
    speed: int
    direction: int # degrees

@app.post("/update-temperature-and-humidity-data")
async def update_temperature_and_humidity_data(sensor_data: TemperatureAndHumiditySensorData, db: AsyncSession = Depends(get_db)):
    timestamp = get_timestamp_now()
    current_temperature = sensor_data.temperature
    current_humidity = sensor_data.humidity

    todays_record = await update_todays_weather(db, current_temperature, timestamp)

    global current_data
    async with current_data_lock:
        current_data["temperature"]=current_temperature
        current_data["humidity"]=current_humidity
        current_data["last_update_temperature_and_humidity"]=format_last_update_time(timestamp)

        current_data["high_temperature_time"]=format_extreme_reading_time(todays_record.max_temp_time)
        current_data["low_temperature_time"]=format_extreme_reading_time(todays_record.min_temp_time)
        current_data["high_temperature"]=todays_record.max_temp
        current_data["low_temperature"]=todays_record.min_temp

    return {"status": "success"}


wind_speed_data_store = WindSpeedDataStore()

@app.post("/update-wind-data")
async def update_wind_data(sensor_data: WindSensorData):
    timestamp = get_timestamp_now()
    current_wind_speed = sensor_data.speed
    current_wind_direction = sensor_data.direction

    wind_speed_data_store.add_wind_speed(timestamp, current_wind_speed, current_wind_direction)

    global current_data
    async with current_data_lock:
        current_data["wind_speed"]=current_wind_speed
        current_data_wind_direction = "-"
        try:
            current_data_wind_direction=direction_degrees_to_compass(current_wind_direction)
        except:
            pass
        current_data["wind_direction"]=current_data_wind_direction
        current_data["last_update_wind_speed"]=format_last_update_time(timestamp)
        highest_wind_gust = wind_speed_data_store.get_highest_gust()
        highest_wind_gust_speed = "-"
        highest_wind_gust_time = "-"
        highest_wind_gust_direction = "-"
        if highest_wind_gust is not None:
            highest_wind_gust_speed=highest_wind_gust.speed
            highest_wind_gust_time=format_extreme_reading_time(highest_wind_gust.timestamp)
            highest_wind_gust_direction=direction_degrees_to_compass(highest_wind_gust.direction)
        current_data["highest_wind_gust"]=highest_wind_gust_speed
        current_data["highest_wind_gust_time"]=highest_wind_gust_time
        current_data["highest_wind_gust_direction"]=highest_wind_gust_direction
        current_data["sustained_wind"]=wind_speed_data_store.calculate_10_minute_average_speed()
        current_data["wind_gusts"]=wind_speed_data_store.get_current_gusts_speed()

    return {"status": "success"}


class DailyWeatherDto(BaseModel):
    day: int
    month: int
    year: int
    min_temp: float
    max_temp: float

@app.get("/update-events-sse")
async def update_events(request: Request):
    async def update_event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break;

                yield { "data": json.dumps(current_data)}

                await asyncio.sleep(0.1)
        except asyncio.CancelledError:
            raise

    return EventSourceResponse(update_event_generator())

@app.get("/last-five-days")
async def get_last_five_days_weather(db: AsyncSession = Depends(get_db)):
    data = await get_last_5_days_weather(db)
    result = []
    for record in data:
        result.append(DailyWeatherDto(day=record.day, month=record.month, year=record.year, min_temp=record.min_temp, max_temp=record.max_temp))

    return result

@app.get("/connection-status-sse")
async def connection_status(request: Request):
    async def connection_status_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break

            # TODO: poll sensor station
            pass
        except asyncio.CancelledError:
            raise

    return EventSourceResponse(connection_status_generator())