from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
import asyncio
from datetime import datetime
import json
from CsvManager import CsvManager
from fastapi import FastAPI, HTTPException
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import os


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


class SensorData(BaseModel):
    temperature: float
    humidity: int


current_data = {
    "temperature": "-",
    "last_update": "-",
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

@app.post("/update-sensor-data")
async def receive_data(sensor_data: SensorData):
    updated_temperature = sensor_data.temperature
    high_temperature = current_data["high_temperature"]
    low_temperature = current_data["low_temperature"]
    previous_temperature = current_data["temperature"]
    timestamp = str(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    current_data["temperature"] = updated_temperature
    current_data["humidity"] = sensor_data.humidity
    current_data["last_update"] = timestamp

    if high_temperature=="-" or updated_temperature > high_temperature:
        current_data["high_temperature"] = updated_temperature
        current_data["high_temperature_time"] = timestamp

    if low_temperature=="-" or updated_temperature < low_temperature:
        current_data["low_temperature"] = updated_temperature
        current_data["low_temperature_time"] = timestamp

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
                #yield f"data: {json.dumps(current_data)}\n\n"

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