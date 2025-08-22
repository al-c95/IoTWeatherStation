from openpyxl import Workbook
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from DailyWeather import DailyWeather, get_calendar_month_weather


async def build_monthly_workbook(db: AsyncSession, year: int, month: int):

    wb = Workbook()
    ws = wb.active
    ws.title = f"Daily Weather - {month}-{year}"

    ws.append(["Day", "Month", "Year", "Min °C", "Max °C"])

    records = await get_calendar_month_weather(db, month, year)
    for record in records:
        ws.append([record.day, record.month, record.year, record.min_temp, record.max_temp])
    
    return wb