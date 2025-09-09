from openai import OpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from DailyWeather import get_last_5_days_weather

from database import SessionLocal, engine
import asyncio


async def get_summary_response(db: AsyncSession):
    data = await get_last_5_days_weather(db)
    lines = []
    for row in data:
        iso_date = f"{row.year:04d}-{row.month:02d}-{row.day:02d}"
        lines.append(f"{iso_date}: min {row.min_temp}°C, max {row.max_temp}°C")
    weather_text = "\n".join(lines)

    openai_client = OpenAI()

    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful assistant for a backyard weather station. Only use the provided data; do not say you lack real-time access."},
            {"role": "user", "content": f"Here is the last 5 days of weather data:\n{weather_text}\n\nSummarise the weather briefly."},
        ],
        temperature=0.7,
        max_tokens=200,
    )

    choice = response.choices[0]

    return choice.message.content