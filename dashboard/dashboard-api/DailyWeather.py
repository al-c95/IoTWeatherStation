from sqlalchemy import Column, Integer, Float, Date, DateTime, Time
from datetime import datetime, date
from sqlalchemy.orm import Session
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


def update_todays_weather(db: Session, current_temp: float, timestamp: DateTime) -> DailyWeather:
    todays_record = None
    query_record = db.query(DailyWeather).filter_by(day=timestamp.day, month=timestamp.month, year=timestamp.year).first()
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

    db.commit()

    return todays_record