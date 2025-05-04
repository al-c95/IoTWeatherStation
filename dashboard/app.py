from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
import asyncio
from datetime import datetime
import json


app = FastAPI()
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def get_dashboard(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})


class SensorData(BaseModel):
    temperature: float
    humidity: int

current_data = {
    "temperature": "-",
    "humidity": "-",
    "last_update": "-"
}

@app.post("/update-sensor-data")
async def receive_data(sensorData: SensorData):
    current_data["temperature"] = sensorData.temperature
    current_data["humidity"] = sensorData.humidity
    current_data["last_update"] = str(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

    return {"status": "success"}

@app.get("/update-events-sse")
async def update_events(request: Request):
    async def update_event_generator():
        while True:
            yield { "data": json.dumps(current_data)}

            await asyncio.sleep(0.1)

    return EventSourceResponse(update_event_generator())