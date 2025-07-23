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
from DailyWeather import *
from sqlalchemy.orm import Session
from database import SessionLocal, engine


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


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


current_data = {
    "temperature": "-",
    "last_update": "2025-07-19 12:00:00",
    "high_temperature": "-",
    "high_temperature_time": "-",
    "low_temperature": "-",
    "low_temperature_time": "-",
    "humidity": "-",
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


class SensorData(BaseModel):
    temperature: float
    humidity: int

@app.post("/update-sensor-data")
async def receive_data(sensor_data: SensorData, db: Session = Depends(get_db)):

    timestamp = datetime.now()
    current_temperature = sensor_data.temperature
    current_humidity = sensor_data.humidity
    todays_record = update_todays_weather(db, current_temperature, timestamp)

    current_data["temperature"]=current_temperature
    current_data["last_update"]=timestamp.strftime("%Y-%m-%d %H:%M:%S")
    current_data["high_temperature_time"]=todays_record.max_temp_time.strftime("%H:%M:%S")
    current_data["low_temperature_time"]=todays_record.min_temp_time.strftime("%H:%M:%S")
    current_data["high_temperature"]=todays_record.max_temp
    current_data["low_temperature"]=todays_record.min_temp
    current_data["humidity"]=current_humidity

    #send_alert(previous_temperature, updated_temperature)

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