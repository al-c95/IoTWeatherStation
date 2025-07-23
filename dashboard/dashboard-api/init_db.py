from database import engine, Base
from DailyWeather import DailyWeather

Base.metadata.create_all(bind=engine)