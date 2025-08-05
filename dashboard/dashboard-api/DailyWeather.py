from sqlalchemy import Column, Integer, Float, DateTime, Time, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List
from database import Base


class DailyWeather(Base):
    __tablename__ = "daily_weather"

    id = Column(Integer, primary_key=True, index=True)
    day = Column(Integer)
    month = Column(Integer)
    year = Column(Integer)
    min_temp = Column(Float)
    max_temp = Column(Float)
    min_temp_time = Column(Time)
    max_temp_time = Column(Time)


async def update_todays_weather(db: AsyncSession, current_temp: float, timestamp: DateTime) -> DailyWeather:
    todays_record = None

    statement = select(DailyWeather).where(
        DailyWeather.day==timestamp.day,
        DailyWeather.month==timestamp.month,
        DailyWeather.year==timestamp.year
    )
    result = await db.execute(statement)
    query_record = result.scalar_one_or_none()

    if query_record:
        todays_record = query_record
        if current_temp > todays_record.max_temp:
            todays_record.max_temp = current_temp
            todays_record.max_temp_time = timestamp.time()
        if current_temp < todays_record.min_temp:
            todays_record.min_temp = current_temp
            todays_record.min_temp_time = timestamp.time()
    else:
        todays_record = DailyWeather(
            day=timestamp.day,
            month=timestamp.month,
            year=timestamp.year,
            min_temp=current_temp,
            max_temp=current_temp,
            max_temp_time = timestamp.time(),
            min_temp_time = timestamp.time()
        )
        db.add(todays_record)

    await db.commit()

    return todays_record


async def get_last_5_days_weather(db: AsyncSession) -> List[DailyWeather]:
    # Stub function
    result = []
    result.append(DailyWeather(day=29, month=7, year=2025, min_temp=2.0, max_temp=17.0))
    result.append(DailyWeather(day=30, month=7, year=2025, min_temp=5.0, max_temp=15.2))
    result.append(DailyWeather(day=31, month=7, year=2025, min_temp=6.5, max_temp=18.2))

    return result