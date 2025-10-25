from datetime import datetime, timedelta
from pydantic import BaseModel
from utils import get_timestamp_now


def direction_degrees_to_compass(direction: int):
    """
    Converts a direction in degrees (0–360) to a 16-point compass rose direction.

    The compass rose is divided into 16 equal sectors, each covering 22.5 degrees:
    N, NNE, NE, ENE, E, ESE, SE, SSE, S, SSW, SW, WSW, W, WNW, NW, NNW.

    Parameters:
        direction (int): The direction in degrees, expected to be in the range [0, 360].

    Returns:
        str: A string representing the compass direction abbreviation (e.g., "N", "SW").

    Raises:
        Exception: If the input direction is not within the 0 to 360 range (inclusive).
    """
    if direction < 0 or direction > 360:
        raise Exception('Compass direction must be between 0 and 360.')
    
    directions = [
        "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
        "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
    ]
    index = round(direction % 360 / 22.5) % 16

    return directions[index]


class HighestWindGust(BaseModel):
    speed: int
    direction: int
    timestamp: datetime


class WindSpeedDataStore:


    def __init__(self):
        self._wind_speed_data={}
        self._highest_gust=None


    def _set_highest_gust(self, speed, direction, timestamp):
        self._highest_gust=HighestWindGust(speed=speed,direction=direction,timestamp=timestamp)


    def add_wind_speed(self, timestamp: datetime, speed: int, direction: int):
        self._wind_speed_data[timestamp]=speed
        if self._highest_gust is None:
            self._set_highest_gust(speed,direction,timestamp)      
        else:
            if speed > self._highest_gust.speed:
                self._set_highest_gust(speed,direction,timestamp)

    
    def _get_last_10_minute_readings(self):
        ten_minutes_ago = get_timestamp_now() - timedelta(minutes=10)
        return [speed for timestamp, speed in self._wind_speed_data.items() if timestamp >= ten_minutes_ago]


    def calculate_10_minute_average_speed(self):
        last_10_minute_readings = self._get_last_10_minute_readings()

        return round(sum(last_10_minute_readings) / len(last_10_minute_readings))
    

    def get_current_gusts_speed(self):
        last_10_minute_readings = self._get_last_10_minute_readings()

        return max(last_10_minute_readings)


    def get_highest_gust(self):
        return self._highest_gust