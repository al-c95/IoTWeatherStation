from sqlalchemy import Column, Integer, Float, DateTime, Time, select, Index
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
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

    __table_args__ = (
        Index("ix_daily_weather_ymd", "year", "month", "day", unique=True),
    )


def sanitise_temperature(temperature):
    if temperature > 60 or temperature < -40:
        return "-"
    return temperature


def sanitise_humidity(humidity):
    if humidity > 100 or humidity < 0:
        return "-"
    return humidity


def format_last_update_time(timestamp):
    return timestamp.strftime("%H:%M:%S")


def format_extreme_reading_time(timestamp):
    return timestamp.strftime("%H:%M:%S")


async def process_temperature_observation(db: AsyncSession, current_temp, timestamp: DateTime) -> DailyWeather:
    """
    Adds temperature observation to today's weather record as minimum or maximum, if lower or higher than current minimum/maximum.
    Performs validation on temperature value and skips minimum/maximum logic if outside bounds.
    Returns the record pertaining today's minimum and maximum.
    """
    todays_record = None

    statement = select(DailyWeather).where(
        DailyWeather.day==timestamp.day,
        DailyWeather.month==timestamp.month,
        DailyWeather.year==timestamp.year
    )
    result = await db.execute(statement)
    query_record = result.scalar_one_or_none()

    if sanitise_temperature(current_temp)!="-":
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
    """
    Returns the last 5 calendar days we have in the DailyWeather table,
    sorted ascending by date (oldest -> newest) for display.
    """
    statement = (select(DailyWeather).order_by(DailyWeather.year.desc(), DailyWeather.month.desc(), DailyWeather.day.desc(),).limit(5))
    result = await db.execute(statement)
    rows_descending = result.scalars().all()
    rows_ascending = list(reversed(rows_descending))

    return rows_ascending


async def get_calendar_month_weather(db: AsyncSession, month: int, year: int) -> List[DailyWeather]:

    statement = select(DailyWeather).where(
        DailyWeather.month==month,
        DailyWeather.year==year
    )
    result = await db.execute(statement)
    rows_descending = result.scalars().all()
    rows_ascending = list(reversed(rows_descending))

    return rows_ascending