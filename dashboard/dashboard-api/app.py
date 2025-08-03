from fastapi import FastAPI, Request, Depends
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
import asyncio
from datetime import datetime
import json
from fastapi import FastAPI, HTTPException
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from DailyWeather import *
from wind import *
from database import SessionLocal, engine
from utils import get_timestamp_now


HIGH_TEMP_THRESHOLD = 27.5
LOW_TEMP_THRESHOLD = 12.5
HIGH_HUMIDITY_THRESHOLD = 70
# set these!
FROM_EMAIL = ''
SENDGRID_API_KEY = ''

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


def send_alert(previous_temperature, updated_temperature):
    if (previous_temperature == '-' or float(previous_temperature) < HIGH_TEMP_THRESHOLD) and updated_temperature >= HIGH_TEMP_THRESHOLD:
        alert_message = Mail(
            from_email=FROM_EMAIL,
            to_emails=[FROM_EMAIL],
            subject='Weather Sensor Alert - 9/13 Curzon St, Ryde NSW 2112',
            plain_text_content=f'Alert: Temperature has exceeded high threshold of {HIGH_TEMP_THRESHOLD}°C'
        )
        try:
            sg = SendGridAPIClient(SENDGRID_API_KEY)
            response = sg.send(alert_message)
            print(response)
        except Exception as e:
            print(f'Failed to send alert: {str(e)}')


def format_last_update_time(timestamp):
    return timestamp.strftime("%Y-%m-%d %H:%M:%S")


def format_minimum_maximum_time(timestamp):
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

    current_data["temperature"]=current_temperature
    current_data["humidity"]=current_humidity
    current_data["last_update_temperature_and_humidity"]=format_last_update_time(timestamp)

    todays_record = await update_todays_weather(db, current_temperature, timestamp)
    
    current_data["high_temperature_time"]=format_minimum_maximum_time(todays_record.max_temp_time)
    current_data["low_temperature_time"]=format_minimum_maximum_time(todays_record.min_temp_time)
    current_data["high_temperature"]=todays_record.max_temp
    current_data["low_temperature"]=todays_record.min_temp

    #send_alert(previous_temperature, updated_temperature)

    return {"status": "success"}


wind_speed_data_store = WindSpeedDataStore()

@app.post("/update-wind-data")
async def update_wind_data(sensor_data: WindSensorData):
    timestamp = get_timestamp_now()
    current_wind_speed = sensor_data.speed
    current_wind_direction = sensor_data.direction

    wind_speed_data_store.add_wind_speed(timestamp, current_wind_speed, current_wind_direction)

    current_data["wind_speed"]=current_wind_speed
    current_data_wind_direction = "-"
    try:
        current_data_wind_direction=direction_degrees_to_compass(current_wind_direction)
    except:
        pass
    current_data["wind_direction"]=current_data_wind_direction
    current_data["last_update_wind_speed"]=format_last_update_time(timestamp)
    current_data["highest_wind_gust"]=wind_speed_data_store.get_highest_gust_speed()
    current_data["highest_wind_gust_time"]=format_minimum_maximum_time(wind_speed_data_store.get_highest_gust_timestamp())
    current_data["highest_wind_gust_direction"]=direction_degrees_to_compass(wind_speed_data_store.get_highest_gust_direction())
    current_data["sustained_wind"]=wind_speed_data_store.calculate_10_minute_average_speed()
    current_data["wind_gusts"]=wind_speed_data_store.get_current_gusts_speed()

    return {"status": "success"}

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