from fastapi import FastAPI, Request, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
import asyncio
import json
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from typing import AsyncGenerator, Dict, Union
from sqlalchemy.ext.asyncio import AsyncSession
from io import BytesIO
from DailyWeather import *
from wind import *
from database import SessionLocal, engine
from utils import get_timestamp_now
from export import build_monthly_workbook
from llm import get_summary_response


app = FastAPI()

origins = [
    "http://localhost:5173" # add ngrok origin here
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

@app.post("/sensor-data/temperature-humidity")
async def update_sensor_data(request: Request, db: AsyncSession = Depends(get_db)):
    timestamp = get_timestamp_now()
    sensor_data = await request.json()
    current_temperature = sensor_data.get("temperature")
    current_humidity = sensor_data.get("humidity")

    todays_record = await process_temperature_observation(db, current_temperature, timestamp)

    global current_data
    async with current_data_lock:
        current_data.update({
            "temperature": current_temperature,
            "humidity": current_humidity,
            "last_update_temperature_and_humidity": format_last_update_time(timestamp),
            "high_temperature_time": format_extreme_reading_time(todays_record.max_temp_time),
            "low_temperature_time": format_extreme_reading_time(todays_record.min_temp_time),
            "high_temperature": todays_record.max_temp,
            "low_temperature": todays_record.min_temp
        })

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

@app.get("/daily-observations/last-five-days")
async def get_last_five_days_weather(db: AsyncSession = Depends(get_db)):
    data = await get_last_5_days_weather(db)
    result = []
    for record in data:
        result.append(DailyWeatherDto(day=record.day, month=record.month, year=record.year, min_temp=record.min_temp, max_temp=record.max_temp))

    return result

@app.get("/daily-observations/month-xlsx")
async def get_monthly_export(month: int = Query(..., ge=1, le=12), year: int = Query(...), db: AsyncSession = Depends(get_db)):
    workbook = await build_monthly_workbook(db, year, month)
    
    buf = BytesIO()
    workbook.save(buf)
    buf.seek(0)

    filename = f"weather_{year:04d}-{month:02d}.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename=\"{filename}\"'},
    )

@app.get("/ai/summarise-last-five-days")
async def summarise_last_five_days(db: AsyncSession = Depends(get_db)):
    response = await get_summary_response(db);

    return response


class WindSensorData(BaseModel):
    speed: int
    direction: int # degrees


wind_speed_data_store = WindSpeedDataStore()
wind_speed_data_store_lock = asyncio.Lock()

@app.post("/update-wind-data")
async def update_wind_data(sensor_data: WindSensorData):
    timestamp = get_timestamp_now()
    current_wind_speed = sensor_data.speed
    current_wind_direction = sensor_data.direction

    global wind_speed_data_store
    async with wind_speed_data_store_lock:
        wind_speed_data_store.add_wind_speed(timestamp, current_wind_speed, current_wind_direction)

    global current_data
    async with current_data_lock:

        current_data_wind_direction = "-"
        try:
            current_data_wind_direction=direction_degrees_to_compass(current_wind_direction)
        except:
            pass

        highest_wind_gust = wind_speed_data_store.get_highest_gust()
        highest_wind_gust_speed = "-"
        highest_wind_gust_time = "-"
        highest_wind_gust_direction = "-"
        if highest_wind_gust is not None:
            highest_wind_gust_speed=highest_wind_gust.speed
            highest_wind_gust_time=format_extreme_reading_time(highest_wind_gust.timestamp)
            highest_wind_gust_direction=direction_degrees_to_compass(highest_wind_gust.direction)
        
        current_data.update({
            "wind_speed": current_wind_speed,
            "wind_direction": current_data_wind_direction,
            "last_update_wind_speed": format_last_update_time(timestamp),
            "highest_wind_gust": highest_wind_gust_speed,
            "highest_wind_gust_time": highest_wind_gust_time,
            "highest_wind_gust_direction": highest_wind_gust_direction,
            "sustained_wind": wind_speed_data_store.calculate_10_minute_average_speed(),
            "wind_gusts": wind_speed_data_store.get_current_gusts_speed()
        })

    return {"status": "success"}